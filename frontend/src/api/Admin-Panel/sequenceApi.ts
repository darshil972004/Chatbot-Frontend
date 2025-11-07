import axios from 'axios';

const ADMIN_PANEL_API_BASE = import.meta.env.VITE_ADMIN_PANEL_API_BASE ?? 'http://localhost:8000/api';

const adminPanelClient = axios.create({
  baseURL: ADMIN_PANEL_API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export type SequenceResponseType = 'Text' | 'Button' | 'Dropdown' | 'Form';

interface SequenceItemApiModel {
  id: number;
  sequence_group_id: number;
  item_name: string;
  item_sequence_position: number;
  item_response_type: SequenceResponseType;
  options: unknown;
  req_parameters: unknown;
  created_at: string;
  updated_at: string;
}

interface SequenceGroupApiModel {
  id: number;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
  items?: SequenceItemApiModel[];
}

export interface FormParameterEntry {
  key: string;
  properties: Record<string, string>;
}

export interface FormParameterProperty {
  key: string;
  value: string;
}

export interface SequenceItem {
  id: number;
  sequenceGroupId: number;
  itemName: string;
  itemSequencePosition: number;
  itemResponseType: SequenceResponseType;
  options: string[];
  requestParameter?: string;
  formParameters: FormParameterEntry[];
  rawReqParameters: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface SequenceGroupWithItems {
  id: number;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  items: SequenceItem[];
}

function parseJsonValue<T>(value: unknown): T | null {
  if (value == null) {
    return null;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.warn('Failed to parse JSON string from API response', error);
      return null;
    }
  }

  if (typeof value === 'object') {
    return value as T;
  }

  return null;
}

function normaliseSequenceItem(apiModel: SequenceItemApiModel): SequenceItem {
  const parsedOptions = parseJsonValue<{ options?: unknown[] }>(apiModel.options);
  const parsedReqParams = parseJsonValue<Record<string, unknown>>(apiModel.req_parameters);

  let requestParameter: string | undefined;
  const formParameters: FormParameterEntry[] = [];

  if (parsedReqParams && typeof parsedReqParams === 'object') {
    const rawRequestParam = parsedReqParams.req_parameters;
    if (typeof rawRequestParam === 'string') {
      requestParameter = rawRequestParam;
    }

    const rawFormParams = parsedReqParams.form_parameters;
    if (rawFormParams && typeof rawFormParams === 'object') {
      Object.entries(rawFormParams as Record<string, unknown>).forEach(([key, value]) => {
        if (value && typeof value === 'object') {
          formParameters.push({
            key,
            properties: value as Record<string, string>,
          });
        }
      });
    }
  }

  const options = Array.isArray(parsedOptions?.options)
    ? parsedOptions!.options.map((option) => String(option))
    : [];

  return {
    id: apiModel.id,
    sequenceGroupId: apiModel.sequence_group_id,
    itemName: apiModel.item_name,
    itemSequencePosition: apiModel.item_sequence_position,
    itemResponseType: apiModel.item_response_type,
    options,
    requestParameter,
    formParameters,
    rawReqParameters: parsedReqParams,
    createdAt: apiModel.created_at,
    updatedAt: apiModel.updated_at,
  };
}

export async function fetchSequenceGroupsWithItems(groupId: number | null = null): Promise<SequenceGroupWithItems[]> {
  const params = groupId != null ? { group_id: groupId } : undefined;
  const { data: groups } = await adminPanelClient.get<SequenceGroupApiModel[]>('/sequence-groups', { params });

  return groups
    .map((group) => {
      const normalisedItems = (group.items ?? [])
        .map(normaliseSequenceItem)
        .sort((a, b) => a.itemSequencePosition - b.itemSequencePosition);

      return {
        id: group.id,
        name: group.name,
        description: group.description ?? '',
        createdAt: group.created_at,
        updatedAt: group.updated_at,
        items: normalisedItems,
      } satisfies SequenceGroupWithItems;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export interface UpdateSequencePositionPayload {
  groupId: number;
  oldPosition: number;
  newPosition: number;
}

export async function reorderSequenceItem(payload: UpdateSequencePositionPayload): Promise<void> {
  await adminPanelClient.patch('/sequence-items/position', {
    group_id: payload.groupId,
    old_position: payload.oldPosition,
    new_position: payload.newPosition,
  });
}

export interface UpdateSequenceItemPayload {
  itemId: number;
  itemName: string;
  itemSequencePosition: number;
  itemResponseType: SequenceResponseType;
  options: string[];
  requestParameter?: string;
  formParameters: FormParameterEntry[];
}

export async function updateSequenceItemDetails(payload: UpdateSequenceItemPayload): Promise<void> {
  await adminPanelClient.patch('/update-sequence-item', {
    item_id: payload.itemId,
    item_name: payload.itemName,
    item_sequence_position: payload.itemSequencePosition,
    item_response_type: payload.itemResponseType,
    options: { options: payload.options },
    req_parameters: {
      req_parameters: payload.requestParameter ?? '',
      form_parameters: payload.formParameters.reduce((acc, entry) => {
        if (entry.key.trim().length) {
          acc[entry.key] = entry.properties;
        }
        return acc;
      }, {} as Record<string, Record<string, string>>),
    },
  });
}

export interface SequenceGroup {
  id: number;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSequenceItemPayload {
  groupId: number;
  itemName: string;
  itemSequencePosition: number;
  itemResponseType: SequenceResponseType;
  options: string[];
  requestParameter?: string;
  formParameters: FormParameterEntry[];
}

export async function createSequenceItem(payload: CreateSequenceItemPayload): Promise<void> {
  await adminPanelClient.post('/create-items', {
    group_id: payload.groupId,
    items: [{
      item_name: payload.itemName,
      item_sequence_position: payload.itemSequencePosition,
      item_response_type: payload.itemResponseType,
      options: { options: payload.options },
      req_parameters: {
        req_parameters: payload.requestParameter ?? '',
        form_parameters: payload.formParameters.reduce((acc, entry) => {
          if (entry.key.trim().length) {
            acc[entry.key] = entry.properties;
          }
          return acc;
        }, {} as Record<string, Record<string, string>>),
      },
    }],
  });
}

export async function fetchSequenceGroupsOnly(): Promise<SequenceGroup[]> {
  const { data: groups } = await adminPanelClient.get<SequenceGroupApiModel[]>('/only-sequence-groups');

  return groups.map((group) => ({
    id: group.id,
    name: group.name,
    description: group.description ?? null,
    createdAt: group.created_at,
    updatedAt: group.updated_at,
  }));
}

export async function deleteSequenceItem(itemId: number): Promise<void> {
  await adminPanelClient.delete('/delete-sequence-item', {
    data: { item_id: itemId },
  });
}
