import { getAhlGame as fetchAhlGame, getAhlScore as fetchAhlScore } from './ahl-data';

export async function getAhlScore(date: string) {
  'use server';
  return fetchAhlScore(date);
}

export async function getAhlGame(id: string) {
  'use server';
  return fetchAhlGame(id);
}
