# War Is Inevitable — Production Game Requirements (PGR)

> **Project:** War Is Investable  
> **Version:** 1.0  
> **Date:** 2026-06-07  
> **Source:** [GDD](https://linear.app/eran-yidgar/document/gdd-dba88ca3b6b5)  
> **Status:** Active  
> **Engine:** Unreal Engine 5 (Blueprint-focused)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Team & Workflow Architecture](#2-team--workflow-architecture)
3. [Technical Architecture](#3-technical-architecture)
4. [Core Systems Specification](#4-core-systems-specification)
5. [Gameplay Systems](#5-gameplay-systems)
6. [AI & Behavior Systems](#6-ai--behavior-systems)
7. [Game Mode: Assault](#7-game-mode-assault)
8. [User Interface & Controls](#8-user-interface--controls)
9. [Asset Requirements](#9-asset-requirements)
10. [Performance Targets](#10-performance-targets)
11. [Implementation Phases](#11-implementation-phases)
12. [Quality Assurance](#12-quality-assurance)
13. [Risk Register](#13-risk-register)

---

## 1. Executive Summary

**War Is Inevitable** (codename: WII) is a single-player, offline Modern Warfare RTS / Tactical Grand Strategy game built in Unreal Engine 5. The player commands a professional military force against hostile militia factions using a Zeus-style deployment interface.

This PGR translates the Game Design Document into concrete, implementable requirements organized by system. Each requirement is tagged with priority (P0–P3), the responsible team member, and acceptance criteria.

### Priority Definitions

| Priority | Meaning | Timeline |
|----------|---------|----------|
| **P0** | Blocker — game cannot function without this | Phase 1–2 |
| **P1** | Critical — core gameplay depends on it | Phase 2–3 |
| **P2** | Important — significantly improves experience | Phase 4–5 |
| **P3** | Nice-to-have — polish and extras | Phase 6 |

---

## 2. Team & Workflow Architecture

### 2.1 Roles

| Role | Agent | Responsibility |
|------|-------|---------------|
| **Lead Builder** | Claude Cowork | Full UE5 Blueprint implementation, asset integration, level design |
| **Architect & Reviewer** | Devin AI | Code review, architecture decisions, file structure, documentation |
| **QA Manager** | Google Studio (Gemini) | Quality checks, error detection, testing validation |
| **Director** | Eran Yidgar | Creative direction, gameplay decisions, project management |

### 2.2 Workflow

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌────────────┐
│   Director  │────▶│ Devin (Arch) │────▶│Claude Cowork │────▶│ Google QA  │
│  (Design)   │     │  (Plan/Rev)  │     │  (Build)     │     │  (Test)    │
└─────────────┘     └──────────────┘     └──────────────┘     └────────────┘
       │                    │                    │                    │
       ▼                    ▼                    ▼                    ▼
   GDD/PGR            Architecture         UE5 Blueprints      Bug Reports
   Decisions          Reviews              C++ (if needed)     Quality Gates
```

### 2.3 File & Folder Structure (UE5 Project)

```
UE_WII/
├── Content/
│   ├── Blueprints/
│   │   ├── Core/              # GameMode, GameState, PlayerController
│   │   ├── Units/             # Infantry, Commando, Tank, Helicopter
│   │   ├── AI/               # BehaviorTrees, EQS, AIController
│   │   ├── UI/               # HUD, DeploymentMenu, SelectionBox
│   │   ├── Combat/           # Projectiles, DamageSystem, WeaponData
│   │   └── GameModes/        # AssaultMode, WaveSpawner
│   ├── Maps/
│   │   ├── Terrain/          # 3km x 3km terrain blocks
│   │   └── Levels/           # Playable assault maps
│   ├── Characters/
│   │   ├── Militia/          # Enemy faction meshes/anims
│   │   └── Military/         # Player faction meshes/anims
│   ├── VFX/                  # Explosions, gunfire, smoke
│   ├── SFX/                  # Sound effects
│   └── DataAssets/           # DataTables for unit stats, weapons, waves
├── Source/                    # C++ (only if Blueprints insufficient)
│   └── WII/
├── Config/
└── Plugins/
```

### 2.4 Communication Protocol

- **Requirements changes** → Update this PGR, notify all agents
- **Architecture decisions** → Devin documents in `/docs/` and reviews implementation
- **Build issues** → Claude Cowork flags in Linear, Google QA triages
- **Bug reports** → Google QA files Linear tickets with reproduction steps

---

## 3. Technical Architecture

### 3.1 Engine Configuration

| Setting | Value | Rationale |
|---------|-------|-----------|
| Engine | UE5 (latest stable) | Blueprint-focused development |
| Rendering | Forward+ or Deferred (no RT) | Performance over visuals |
| Ray Tracing | **DISABLED** | FPS priority |
| DLSS/FSR | **ENABLED** | Performance upscaling |
| Dynamic Resolution | **ENABLED** | Adaptive quality |
| HDR | **ENABLED** | Visual fidelity |
| V-Sync | **ENABLED** (configurable) | Tear-free display |
| NVENC | **ENABLED** | Video encoding optimization |
| Mass Entity | **REQUIRED** | Large unit count simulation |

### 3.2 Core Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    WII_GameMode (BP)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  UnitManager │  │ WaveSpawner  │  │ ObjectiveManager │  │
│  │  (Subsystem) │  │  (Actor)     │  │   (Subsystem)    │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                  │                   │            │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌────────▼─────────┐  │
│  │ MassEntity   │  │ SpawnVolumes │  │ CaptureZones     │  │
│  │ Processor    │  │ + WaveData   │  │ + Triggers       │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  CombatSys   │  │  AI Director │  │  DeploymentSys   │  │
│  │  (Component) │  │  (Subsystem) │  │  (PlayerCtrl)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Mass Entity Integration

**Purpose:** Handle 50–200+ active soldiers simultaneously without FPS degradation.

| Requirement | Details | Priority |
|------------|---------|----------|
| REQ-TECH-001 | All infantry units use Mass Entity for simulation | P0 |
| REQ-TECH-002 | Mass Entity → full actor promotion on close-up/engagement | P1 |
| REQ-TECH-003 | LOD transitions at 100m / 300m / 600m distances | P1 |
| REQ-TECH-004 | Batch movement commands via Mass Entity processors | P0 |
| REQ-TECH-005 | Spatial hashing for proximity queries (cover, flanking) | P1 |

**Acceptance Criteria:**
- 100 units on-screen at 60 FPS (target hardware: RTX 3060 / RX 6700 XT)
- Unit promotion/demotion seamless (no visible pop-in at gameplay distances)
- Memory budget: <2GB for all active units at peak

### 3.4 Map Architecture

| Requirement | Details | Priority |
|------------|---------|----------|
| REQ-TECH-006 | Maps are self-contained 3km × 3km terrain blocks | P0 |
| REQ-TECH-007 | No open-world streaming — single level load per mission | P0 |
| REQ-TECH-008 | Terrain: heightmap-based with foliage placement | P1 |
| REQ-TECH-009 | Destructible props (walls, doors, cover objects) | P2 |
| REQ-TECH-010 | Navigation mesh covers full playable area | P0 |

---

## 4. Core Systems Specification

### 4.1 Unit System

Every unit (player and enemy) shares a base component architecture:

```
BP_UnitBase (Actor)
├── MassEntityRepresentation (Component)
├── HealthComponent
│   ├── float MaxHealth
│   ├── float CurrentHealth
│   └── event OnDeath
├── MoraleComponent
│   ├── float Morale [0–100]
│   ├── float MoraleDecayRate
│   └── event OnRouteTrigger (Morale < 20)
├── AmmoComponent
│   ├── int CurrentAmmo
│   ├── int MaxAmmo
│   ├── float ReloadTime
│   └── bool bIsReloading
├── FatigueComponent
│   ├── float Fatigue [0–100]
│   ├── float FatigueGainRate (per action)
│   └── float RecoveryRate (when idle)
├── CombatComponent
│   ├── WeaponData (DataAsset ref)
│   ├── float Accuracy
│   ├── float FireRate
│   └── func EngageTarget(AActor* Target)
└── NavigationComponent
    ├── func MoveTo(FVector Destination)
    ├── func FindCover(float SearchRadius)
    └── bool bIsInCover
```

#### Requirements

| ID | Requirement | Priority |
|----|------------|----------|
| REQ-UNIT-001 | Units track Health, Morale, Ammo, Fatigue simultaneously | P0 |
| REQ-UNIT-002 | Morale below 20 triggers rout (unit flees to rally point) | P1 |
| REQ-UNIT-003 | Ammo depletion forces unit to seek resupply or go melee | P1 |
| REQ-UNIT-004 | Fatigue above 80 reduces movement speed by 30% and accuracy by 20% | P1 |
| REQ-UNIT-005 | Death triggers ragdoll + removal from command chain | P0 |
| REQ-UNIT-006 | Units respond to player commands within 0.5s | P0 |

### 4.2 Unit Types (Player Arsenal)

| Type | Count per Team | Role | Special Ability |
|------|---------------|------|----------------|
| **Infantry** | 4–8 | General purpose | Suppressive fire |
| **Commando/SpecOps** | 2–4 | Breach & CQB | Flashbang, faster breach |
| **Sniper** | 1–2 | Long-range elimination | Spotting, one-shot headshot |
| **Tank (Armor)** | 1 | Heavy suppression | Area denial, draw RPG fire |
| **Helicopter (Extraction)** | 1 | Transport/evac | Rapid repositioning |

#### Requirements

| ID | Requirement | Priority |
|----|------------|----------|
| REQ-UNIT-007 | Each unit type has unique DataAsset defining stats | P0 |
| REQ-UNIT-008 | Infantry: suppressive fire reduces enemy accuracy by 40% in cone | P1 |
| REQ-UNIT-009 | Commando: breach action on doors (2s animation, clears room) | P1 |
| REQ-UNIT-010 | Sniper: 500m+ effective range, headshot multiplier 3x | P1 |
| REQ-UNIT-011 | Tank: high HP (5000), slow, vulnerable to RPG rear hits | P1 |
| REQ-UNIT-012 | Helicopter: air transport, cannot attack, can be shot down by RPG | P2 |

### 4.3 Command System

The player interacts through a Zeus-style top-down interface:

| ID | Requirement | Priority |
|----|------------|----------|
| REQ-CMD-001 | Click-to-select individual units | P0 |
| REQ-CMD-002 | Drag box to select multiple units | P0 |
| REQ-CMD-003 | Right-click to issue move command to selected units | P0 |
| REQ-CMD-004 | Shift+right-click for waypoint queue | P1 |
| REQ-CMD-005 | Unit context menu: Attack, Hold, Retreat, Special | P1 |
| REQ-CMD-006 | Team grouping via Ctrl+Number (1–9) | P1 |
| REQ-CMD-007 | Double-click to select all units of same type | P2 |

---

## 5. Gameplay Systems

### 5.1 Deployment System (Zeus-Style)

The player deploys units before and during combat from a strategic overhead view.

```
DeploymentSystem
├── DeploymentMenu (Widget)
│   ├── UnitCatalog (ScrollBox)
│   │   ├── InfantryTeam_Card
│   │   ├── CommandoTeam_Card
│   │   ├── SniperTeam_Card
│   │   ├── TankUnit_Card
│   │   └── HelicopterUnit_Card
│   ├── DeploymentBudget (int remaining points)
│   └── DeploymentZone (highlight valid placement areas)
├── PlacementPreview (ghost mesh at cursor)
└── ConfirmPlacement (left-click to place)
```

| ID | Requirement | Priority |
|----|------------|----------|
| REQ-DEP-001 | Deployment menu accessible via hotkey (Tab) during planning phase | P0 |
| REQ-DEP-002 | Ghost preview shows valid/invalid placement (green/red) | P0 |
| REQ-DEP-003 | Budget system limits total units per mission | P1 |
| REQ-DEP-004 | Placed units immediately begin idle behavior | P0 |
| REQ-DEP-005 | Re-deployment available between objective captures | P2 |

### 5.2 Combat System

| ID | Requirement | Priority |
|----|------------|----------|
| REQ-COM-001 | Hit detection uses line traces with spread cone | P0 |
| REQ-COM-002 | Damage calculated: BaseDmg × RangeModifier × CoverModifier | P0 |
| REQ-COM-003 | Cover system: full cover (90% dmg reduction), half cover (50%) | P0 |
| REQ-COM-004 | Suppression mechanic: sustained fire pins enemies | P1 |
| REQ-COM-005 | Friendly fire enabled (encourages tactical positioning) | P2 |
| REQ-COM-006 | Weapon sounds trigger AI awareness (EQS hearing sense) | P1 |
| REQ-COM-007 | Kill feed / combat log (minimal UI, top-right) | P2 |

### 5.3 Damage Model

```
Damage Pipeline:
  Shooter.FireWeapon()
    → LineTrace with spread (based on Accuracy + Fatigue penalty)
    → Hit? → Calculate: BaseDamage * DistanceFalloff * ArmorModifier * CoverModifier
    → Apply to Target.HealthComponent
    → If Health <= 0 → Death event
    → Nearby allies: MoraleComponent.OnAllyDeath() → Morale -= 15
```

| Range Bracket | Modifier |
|--------------|----------|
| 0–50m | 1.0× |
| 50–150m | 0.8× |
| 150–300m | 0.5× |
| 300–500m | 0.3× (Sniper: 0.9×) |
| 500m+ | 0.1× (Sniper: 0.7×) |

---

## 6. AI & Behavior Systems

### 6.1 Architecture

```
AI System
├── AIDirector (Subsystem)
│   ├── DifficultyScaling
│   ├── WaveComposition
│   └── FlankCoordination
├── BehaviorTrees/
│   ├── BT_Infantry_Player     # Player-controlled unit autonomy
│   ├── BT_Infantry_Militia    # Enemy base infantry
│   ├── BT_RPG_Militia         # Enemy RPG specialist
│   └── BT_Commando_Player     # Player commando autonomy
└── EQS/
    ├── EQS_FindCover           # Locate nearest valid cover
    ├── EQS_FlankPosition       # Find flanking route
    ├── EQS_SniperPerch         # Elevated positions with LOS
    └── EQS_RPG_AntiArmor       # Positions with tank LOS
```

### 6.2 Player Unit AI (Autonomous Behavior)

Player units execute commands but have autonomous self-preservation:

| ID | Requirement | Priority |
|----|------------|----------|
| REQ-AI-001 | Units auto-seek cover when under fire (no player input needed) | P0 |
| REQ-AI-002 | Units return fire at visible enemies when in "Engage" stance | P0 |
| REQ-AI-003 | Units auto-reload when safe (behind cover + no immediate threat) | P1 |
| REQ-AI-004 | Wounded units crawl to nearest cover if able | P2 |
| REQ-AI-005 | Routed units flee to nearest rally point (behind friendly lines) | P1 |

### 6.3 Enemy AI — Militia Faction

**Characteristics:**
- Numerous, lightly-equipped infantry
- Small arms + RPGs (no vehicles, no air support)
- Aggressive, coordinated counter-attacks

| ID | Requirement | Priority |
|----|------------|----------|
| REQ-AI-006 | Militia seeks cover using EQS_FindCover on first contact | P0 |
| REQ-AI-007 | Militia RPG units prioritize tanks (EQS_RPG_AntiArmor) | P1 |
| REQ-AI-008 | Militia attempts flanking maneuvers (EQS_FlankPosition) | P1 |
| REQ-AI-009 | Militia spawns in coordinated waves (see §7 Wave System) | P0 |
| REQ-AI-010 | Militia uses suppressive fire to cover advancing allies | P2 |
| REQ-AI-011 | Militia retreats when squad casualties exceed 70% | P2 |
| REQ-AI-012 | RPG units aim for rear/side of tanks (2× damage multiplier) | P1 |

### 6.4 EQS Query Specifications

**EQS_FindCover:**
```
Generator: Points on NavMesh (radius 15m from unit)
Filter: 
  - Has blocking geometry between point and threat direction
  - Not already occupied by 2+ allies
  - Reachable within 3s movement
Score:
  - Distance to threat (prefer closer but safe)
  - Cover quality (full > half)
  - Line of sight to engagement area (prefer maintaining LOS)
```

**EQS_FlankPosition:**
```
Generator: Ring around target (radius 20–40m)
Filter:
  - Not in target's forward cone (120°)
  - Has cover en route
  - NavMesh reachable
Score:
  - Angle from target's facing (prefer 90°+)
  - Distance from other friendlies (spread out)
  - Cover availability at destination
```

---

## 7. Game Mode: Assault

### 7.1 Mode Overview

The core gameplay loop: Attack → Capture → Defend → Advance.

```
Mission Flow:
  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
  │ Planning │───▶│  Attack  │───▶│ Capture  │───▶│  Defend  │──┐
  │  Phase   │    │  Phase   │    │  Phase   │    │  Phase   │  │
  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
       ▲                                                         │
       └──── Next Objective ◀────────────────────────────────────┘
                                                    (if more objectives)
                                                         │
                                                    ┌────▼─────┐
                                                    │ VICTORY  │
                                                    └──────────┘
```

### 7.2 Phase Requirements

#### Planning Phase

| ID | Requirement | Priority |
|----|------------|----------|
| REQ-AST-001 | Player sees map overview with objective markers | P0 |
| REQ-AST-002 | Deployment zone highlighted (safe area behind front line) | P0 |
| REQ-AST-003 | Time-unlimited planning (player initiates attack) | P0 |
| REQ-AST-004 | Intel overlay shows known enemy positions (fog of war) | P2 |

#### Attack Phase

| ID | Requirement | Priority |
|----|------------|----------|
| REQ-AST-005 | Player commands units toward objective | P0 |
| REQ-AST-006 | Enemy defenders are pre-placed in cover around objective | P0 |
| REQ-AST-007 | Objective marker shows capture progress | P1 |
| REQ-AST-008 | No time limit — player sets pace | P0 |

#### Capture Phase

| ID | Requirement | Priority |
|----|------------|----------|
| REQ-AST-009 | Capture zone is a defined area (50m radius) around objective | P0 |
| REQ-AST-010 | Capture requires 3+ player units in zone, 0 enemies | P0 |
| REQ-AST-011 | Capture progress bar (15s to full capture) | P1 |
| REQ-AST-012 | Capture interrupted if enemy enters zone | P1 |

#### Defend Phase (Wave System)

| ID | Requirement | Priority |
|----|------------|----------|
| REQ-AST-013 | Capturing a point triggers wave spawner | P0 |
| REQ-AST-014 | Wave 1 — Small: 10–15 infantry from 1 direction | P0 |
| REQ-AST-015 | Wave 2 — Medium: 20–30 infantry from 2 directions | P0 |
| REQ-AST-016 | Wave 3 — Large: 40–50 infantry + RPGs from 3 directions | P0 |
| REQ-AST-017 | 30s cooldown between waves (re-position time) | P1 |
| REQ-AST-018 | Wave complete when all enemies in wave eliminated | P0 |
| REQ-AST-019 | All 3 waves survived = objective secured | P0 |

### 7.3 Wave Spawner Specification

```
WaveSpawner (Actor)
├── WaveDataTable (DataAsset)
│   ├── Wave[0]: {count: 12, types: [Infantry], directions: [North], delay: 0s}
│   ├── Wave[1]: {count: 25, types: [Infantry], directions: [North, East], delay: 30s}
│   └── Wave[2]: {count: 45, types: [Infantry, RPG], directions: [N, E, W], delay: 30s}
├── SpawnVolumes[] (per-direction spawn areas, outside player LOS)
├── ActiveWaveIndex (int)
├── RemainingEnemies (int)
└── Events:
    ├── OnWaveStart(int WaveIndex)
    ├── OnWaveComplete(int WaveIndex)
    └── OnAllWavesComplete()
```

### 7.4 Victory & Defeat Conditions

| Condition | Trigger | Result |
|-----------|---------|--------|
| **Victory** | All objectives captured + all waves defended | Mission complete screen |
| **Defeat** | All player units eliminated | Mission failed screen |
| **Partial** | Some objectives captured, player retreats | Score based on progress |

---

## 8. User Interface & Controls

### 8.1 Camera System

| ID | Requirement | Priority |
|----|------------|----------|
| REQ-UI-001 | Top-down RTS camera (45° pitch, rotatable) | P0 |
| REQ-UI-002 | Zoom: mouse scroll (min 20m, max 500m altitude) | P0 |
| REQ-UI-003 | Pan: WASD or screen-edge scroll | P0 |
| REQ-UI-004 | Rotate: middle-mouse drag or Q/E keys | P1 |
| REQ-UI-005 | Camera follows selected unit (toggle with Space) | P2 |
| REQ-UI-006 | Smooth interpolation on all camera moves (lerp 0.1s) | P1 |

### 8.2 HUD Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [Kill Feed]                                    [Wave Info]   │
│                                                [2/3 ████░]  │
│                                                             │
│                                                             │
│                     GAMEPLAY AREA                            │
│                                                             │
│                                                             │
│                                                             │
│ [Selected Unit Info]              [Minimap]                  │
│ ├─ Name: Alpha Team              ┌────────┐                │
│ ├─ HP: ████████░░ 80%            │  ◆  •  │                │
│ ├─ Morale: ██████░░░░ 60%        │ •    • │                │
│ ├─ Ammo: 120/240                 │   ◇    │                │
│ └─ Status: In Cover              └────────┘                │
│                                                             │
│ [Command Bar: Attack | Hold | Retreat | Special | Deploy]   │
└─────────────────────────────────────────────────────────────┘
```

### 8.3 Key Bindings

| Key | Action |
|-----|--------|
| LMB | Select unit / Place deployment |
| RMB | Move to / Attack target |
| Tab | Open deployment menu |
| 1–9 | Select control group |
| Ctrl+1–9 | Assign control group |
| Space | Center camera on selection |
| F1 | Pause / tactical view |
| Shift+RMB | Queue waypoint |
| A | Attack-move |
| H | Hold position |
| R | Retreat to rally |

---

## 9. Asset Requirements

### 9.1 Characters

| Asset | Variants | LODs | Animations Required |
|-------|----------|------|-------------------|
| Infantry (Player) | 3 skins | 3 | Idle, Walk, Run, Crouch, Prone, Fire, Reload, Death(3), Cover-peek |
| Commando (Player) | 2 skins | 3 | + Breach, Flashbang-throw |
| Sniper (Player) | 1 skin | 3 | + Scope-aim, Crawl |
| Militia Infantry | 4 skins | 3 | Same as Infantry (Player) |
| Militia RPG | 2 skins | 3 | + RPG-shoulder, RPG-fire |

### 9.2 Vehicles

| Asset | LODs | Animations |
|-------|------|-----------|
| Tank (IFV/MBT style) | 3 | Turret rotate, Fire, Destroyed |
| Helicopter (Transport) | 3 | Rotor spin, Land, Takeoff, Destroyed |

### 9.3 Environment

| Asset Category | Quantity | Notes |
|---------------|----------|-------|
| Village buildings | 15–20 | Modular kit (walls, roofs, doors) |
| Cover objects | 30+ | Sandbags, walls, vehicles, crates |
| Terrain textures | 5–8 | Dirt, grass, rock, road, sand |
| Foliage | 5–10 | Trees, bushes, tall grass |
| Props | 20+ | Barrels, fences, utility poles |

### 9.4 VFX

| Effect | Trigger |
|--------|---------|
| Muzzle flash | Weapon fire |
| Bullet impact (dirt/stone/metal) | Hit surface |
| Blood spatter | Hit character |
| Explosion (small) | Grenade/RPG impact |
| Explosion (large) | Tank shell / vehicle destroy |
| Smoke trail | RPG in-flight |
| Dust kick-up | Near explosions, vehicle movement |

### 9.5 Audio

| Category | Minimum Variations |
|----------|-------------------|
| Rifle fire | 3 per weapon type |
| Explosion | 3 (small, medium, large) |
| Vehicle engine | 2 (tank, helicopter) |
| Footsteps | 4 surfaces (dirt, stone, grass, wood) |
| Radio chatter | 10 callout lines |
| Ambient | 3 environments (wind, distant combat, birds) |
| UI sounds | 5 (select, command, alert, capture, wave-start) |

---

## 10. Performance Targets

### 10.1 Target Hardware

| Tier | GPU | CPU | Target FPS |
|------|-----|-----|-----------|
| Minimum | GTX 1660 / RX 5600 | i5-10400 / R5 3600 | 30 FPS |
| Recommended | RTX 3060 / RX 6700 XT | i7-12700 / R7 5800X | 60 FPS |
| High | RTX 4070+ | i9-13900 / R9 7900X | 120 FPS |

### 10.2 Performance Budgets

| Metric | Budget |
|--------|--------|
| Draw calls per frame | < 3000 |
| Triangle count (visible) | < 5M |
| Active actors (full) | < 50 |
| Mass Entity instances | < 200 |
| AI behavior tree ticks/frame | < 30 |
| Memory (total) | < 8 GB |
| Level load time | < 15s |
| Save/Load time | < 3s |

### 10.3 Optimization Strategies

1. **Mass Entity** for distant/idle units → full actor only when engaged
2. **LOD aggressive** — 3 levels with significant poly reduction
3. **Instanced Static Meshes** for repeated cover/props
4. **Niagara pooling** for VFX (pre-warm particle systems)
5. **Audio attenuation** — cull sounds beyond 200m
6. **Navmesh chunking** — only rebuild modified sections

---

## 11. Implementation Phases

### Phase 1 — Core Movement (DEV-6) `[P0]`

**Deliverables:**
- [ ] Top-down RTS camera with zoom/pan/rotate
- [ ] Unit selection (click + drag-box)
- [ ] Click-to-move (NavMesh pathfinding)
- [ ] Basic unit actor with movement component
- [ ] Ground truth: single infantry unit moves where you click

**Acceptance:** Player can select and move a unit on a flat terrain map.

---

### Phase 2 — Combat Basics `[P0]`

**Deliverables:**
- [ ] Weapon system (fire, reload, ammo tracking)
- [ ] Hit detection (line trace with accuracy cone)
- [ ] Damage pipeline (health, death)
- [ ] Basic enemy spawning (static placement)
- [ ] Cover detection (ray test for blocking geometry)

**Acceptance:** Player units can engage and kill static enemies; enemies die when HP reaches 0.

---

### Phase 3 — AI Foundation `[P0–P1]`

**Deliverables:**
- [ ] Behavior Tree for player unit autonomy (seek cover, return fire)
- [ ] Behavior Tree for militia infantry (patrol, engage, seek cover)
- [ ] EQS_FindCover implementation
- [ ] EQS_FlankPosition implementation
- [ ] AI Director basic setup (spawn coordination)

**Acceptance:** Enemy units actively seek cover, fire at player units, and attempt flanking.

---

### Phase 4 — Assault Mode `[P1]`

**Deliverables:**
- [ ] Objective/capture zone system
- [ ] Wave spawner with 3-wave escalation
- [ ] Deployment system (Zeus-style unit placement)
- [ ] Mission flow (plan → attack → capture → defend → victory)
- [ ] Multiple unit types (infantry, sniper, commando)
- [ ] RPG units targeting tanks

**Acceptance:** Full assault loop playable — deploy, attack objective, survive 3 waves.

---

### Phase 5 — Full Unit Roster & Advanced AI `[P1–P2]`

**Deliverables:**
- [ ] Tank unit (high HP, turret, vulnerable to RPG)
- [ ] Helicopter unit (transport, extraction)
- [ ] Morale system (rout behavior)
- [ ] Fatigue system (movement/accuracy penalties)
- [ ] Suppression mechanic
- [ ] Advanced militia coordination (multi-squad flanking)
- [ ] Multiple maps/missions

**Acceptance:** All unit types functional; morale and fatigue affect gameplay; 3+ playable maps.

---

### Phase 6 — Polish `[P2–P3]`

**Deliverables:**
- [ ] Replace blockout terrain with Gaea/sculpted terrain
- [ ] Full sound effects implementation
- [ ] VFX (explosions, gunfire, smoke, dust)
- [ ] Basic main menu and settings
- [ ] Save/Load system
- [ ] Performance optimization pass
- [ ] Bug fixing and balancing

**Acceptance:** Game feels complete; consistent 60 FPS on recommended hardware; no critical bugs.

---

## 12. Quality Assurance

### 12.1 Testing Protocol (Google Studio QA)

| Test Type | Frequency | Owner |
|-----------|-----------|-------|
| Compilation check | Every commit | Automated |
| Blueprint error scan | Daily | Google QA |
| Gameplay smoke test | Per phase delivery | Google QA |
| Performance profiling | Weekly | Google QA |
| AI behavior validation | Per AI change | Google QA |
| Regression testing | Before milestone | Google QA + Devin |

### 12.2 Quality Gates

Each phase must pass before proceeding:

1. **No Blueprint errors or warnings** (except documented exceptions)
2. **FPS ≥ 60** on recommended hardware at expected unit count for that phase
3. **All listed deliverables functional** (checked against acceptance criteria)
4. **No crash bugs** in normal gameplay flow
5. **Code review passed** (Devin architecture review)

### 12.3 Bug Severity Classification

| Severity | Definition | Response Time |
|----------|-----------|---------------|
| S1 — Critical | Crash, data loss, progression blocker | Fix immediately |
| S2 — Major | Gameplay broken but workaround exists | Fix within 24h |
| S3 — Minor | Visual glitch, non-blocking issue | Fix in current phase |
| S4 — Cosmetic | Polish item, suggestion | Backlog for Phase 6 |

---

## 13. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Mass Entity complexity exceeds Blueprint capability | Medium | High | Prepare C++ fallback for Mass Entity processors |
| Performance target missed at 100+ units | Medium | High | Aggressive LOD + cull distances; reduce max simultaneous units |
| AI behavior trees too complex for Blueprint | Low | Medium | Keep BTs shallow (max 4 levels); use sub-trees |
| Scope creep beyond assault mode | High | Medium | Strict phase gates; no new features without PGR update |
| Asset production bottleneck | Medium | Medium | Use Marketplace/free assets for prototype; replace in Phase 6 |
| UE5 version upgrade breaks project | Low | High | Pin engine version; only upgrade between phases |

---

## Appendix A: Data Tables Schema

### DT_UnitStats

| Column | Type | Example (Infantry) |
|--------|------|-------------------|
| UnitType | Name | Infantry |
| MaxHealth | Float | 100.0 |
| MoveSpeed | Float | 400.0 |
| MaxAmmo | Int | 240 |
| ReloadTime | Float | 2.5 |
| Accuracy | Float | 0.7 |
| FireRate | Float | 10.0 (rounds/sec) |
| EffectiveRange | Float | 200.0 (meters) |
| ArmorRating | Float | 0.1 |
| TeamSize | Int | 6 |

### DT_WaveConfig

| Column | Type | Example (Wave 2) |
|--------|------|-----------------|
| WaveIndex | Int | 1 |
| EnemyCount | Int | 25 |
| UnitTypes | Name[] | [Infantry, Infantry, RPG] |
| SpawnDirections | Name[] | [North, East] |
| SpawnDelay | Float | 30.0 |
| RPGRatio | Float | 0.2 |

### DT_WeaponData

| Column | Type | Example (AK-variant) |
|--------|------|---------------------|
| WeaponName | Name | Militia_AK |
| BaseDamage | Float | 25.0 |
| FireRate | Float | 10.0 |
| MagazineSize | Int | 30 |
| ReloadTime | Float | 2.8 |
| SpreadAngle | Float | 3.0 (degrees) |
| MuzzleVelocity | Float | 715.0 |
| EffectiveRange | Float | 300.0 |

---

## Appendix B: Blueprint Naming Conventions

| Type | Prefix | Example |
|------|--------|---------|
| Actor Blueprint | BP_ | BP_Infantry_Player |
| Widget Blueprint | WBP_ | WBP_HUD_Main |
| Behavior Tree | BT_ | BT_Infantry_Militia |
| Blackboard | BB_ | BB_Unit_Base |
| EQS Query | EQS_ | EQS_FindCover |
| Data Asset | DA_ | DA_WeaponData_AK |
| Data Table | DT_ | DT_UnitStats |
| Material | M_ | M_Terrain_Grass |
| Material Instance | MI_ | MI_Terrain_Grass_Dry |
| Niagara System | NS_ | NS_Explosion_Large |
| Anim Blueprint | ABP_ | ABP_Infantry |
| Anim Montage | AM_ | AM_Infantry_Fire |
| Enum | E_ | E_UnitState |
| Structure | S_ | S_WaveConfig |
| Interface | I_ | I_Damageable |
| Game Mode | GM_ | GM_Assault |

---

## Appendix C: Linear Ticket Mapping

| Phase | Linear Ticket | Status |
|-------|--------------|--------|
| Phase 1 — Core Movement | DEV-6 | In Progress |
| Phase 6 — Polish | DEV-11 | Todo |
| UE5 Cowork Integration | DEV-12 | In Progress |
| GitHub Connection | DEV-13 | Todo |
| PGR Design (this doc) | DEV-14 | In Progress |

---

*End of PGR v1.0 — This document is the single source of truth for implementation requirements. All changes require Director approval and version increment.*
