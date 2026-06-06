import { describe, it, expect } from 'vitest';
import { parseCSV } from '../csvParser';

describe('parseCSV', () => {
  it('parses a basic CSV string', () => {
    const csv = 'name,age\nAlice,30\nBob,25';
    const result = parseCSV(csv);
    expect(result).toEqual([
      { name: 'Alice', age: '30' },
      { name: 'Bob', age: '25' },
    ]);
  });

  it('returns empty array for header-only CSV', () => {
    expect(parseCSV('name,age')).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(parseCSV('')).toEqual([]);
  });

  it('returns empty array for single empty line', () => {
    expect(parseCSV('\n')).toEqual([]);
  });

  it('strips quotes from headers and values', () => {
    const csv = '"name","age"\n"Alice","30"';
    const result = parseCSV(csv);
    expect(result).toEqual([{ name: 'Alice', age: '30' }]);
  });

  it('handles commas inside quoted fields', () => {
    const csv = 'name,description\nAlice,"likes cats, dogs"';
    const result = parseCSV(csv);
    expect(result).toEqual([{ name: 'Alice', description: 'likes cats, dogs' }]);
  });

  it('assigns empty string for missing values', () => {
    const csv = 'a,b,c\n1,2';
    const result = parseCSV(csv);
    expect(result[0].c).toBe('');
  });

  it('handles trailing whitespace around values', () => {
    const csv = 'name , age \n Alice , 30 ';
    const result = parseCSV(csv);
    expect(result[0].name).toBe('Alice');
    expect(result[0].age).toBe('30');
  });

  it('parses multiple rows correctly', () => {
    const csv = 'ticker,price\nAAPL,150\nMSFT,400\nGOOGL,170';
    const result = parseCSV(csv);
    expect(result.length).toBe(3);
    expect(result[2]).toEqual({ ticker: 'GOOGL', price: '170' });
  });
});
