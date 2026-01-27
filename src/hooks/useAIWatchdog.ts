import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AIWatchdogIssue {
  severity: 'critical' | 'warning' | 'info';
  category: 'suspicious_activity' | 'misinformation' | 'illogical_data';
  description: string;
  affected: string;
  recommendation: string;
}

export interface AIWatchdogAnalysis {
  summary: string;
  issues: AIWatchdogIssue[];
  clean_data_score: number;
  parseError?: boolean;
}

export interface AIWatchdogResult {
  success: boolean;
  analysis: AIWatchdogAnalysis;
  analyzedAt: string;
}

export function useAIWatchdog() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<AIWatchdogResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const runAnalysis = useCallback(async (customData?: unknown) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-data-watchdog`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            analysisType: 'full',
            data: customData,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Analysis failed: ${response.status}`);
      }

      const result: AIWatchdogResult = await response.json();
      setLastAnalysis(result);

      // Show toast based on results
      const criticalCount = result.analysis.issues.filter(i => i.severity === 'critical').length;
      const warningCount = result.analysis.issues.filter(i => i.severity === 'warning').length;

      if (criticalCount > 0) {
        toast({
          variant: 'destructive',
          title: 'Critical Issues Detected',
          description: `AI Watchdog found ${criticalCount} critical issue(s) requiring immediate attention.`,
        });
      } else if (warningCount > 0) {
        toast({
          title: 'Warnings Detected',
          description: `AI Watchdog found ${warningCount} warning(s) to review.`,
        });
      } else {
        toast({
          title: 'Analysis Complete',
          description: `Data integrity score: ${result.analysis.clean_data_score}/100`,
        });
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
      toast({
        variant: 'destructive',
        title: 'AI Analysis Failed',
        description: message,
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [toast]);

  return {
    isAnalyzing,
    lastAnalysis,
    error,
    runAnalysis,
  };
}
