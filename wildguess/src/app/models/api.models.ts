/** API response types matching backend contract */

export interface User {
    id: string;
    username: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface MeResponse {
    user: User;
}

export interface RoomSummary {
    id: string;
    name: string;
    phase: RoomPhase;
    memberCount: number;
    isHost: boolean;
}

export type RoomPhase = 'voting' | 'revealed' | 'versus';

export interface RoomMember {
    userId: string;
    username: string;
    isHost: boolean;
    hasVoted: boolean;
    vote?: string;
}

export interface VoteStats {
    average: number;
    median: number;
    min: number;
    max: number;
    mode: number[];
    totalVotes: number;
    distribution: Record<string, number>;
}

export interface VersusData {
    low: { userId: string; username: string; vote: string };
    high: { userId: string; username: string; vote: string };
}

export interface RoomState {
    id: string;
    name: string;
    phase: RoomPhase;
    round: number;
    currentTopic: string | null;
    hostId: string;
    isHost: boolean;
    members: RoomMember[];
    stats?: VoteStats;
    versus?: VersusData;
}

export const FIBONACCI_VALUES = ['1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?'] as const;
