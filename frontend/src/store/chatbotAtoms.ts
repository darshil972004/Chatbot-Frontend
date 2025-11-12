import { atom } from 'recoil';

export interface SequenceItem {
  id: number;
  sequence_group_id: number;
  item_name: string;
  item_sequence_position: number;
  item_response_type: 'Text' | 'Button' | 'Dropdown';
  options: any;
  req_parameters: any;
  created_at: string;
  updated_at: string;
}

export interface SequenceGroup {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  items?: SequenceItem[];
}

export const sequenceGroupsState = atom<SequenceGroup[]>({
  key: 'sequenceGroupsState',
  default: [],
});

export const selectedGroupIdState = atom<number | null>({
  key: 'selectedGroupIdState',
  default: null,
});

// Add more atoms as needed for form state, loading states, etc.
