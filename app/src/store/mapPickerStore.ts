// src/store/mapPickerStore.ts
type MapResult = {
  latitude: number;
  longitude: number;
  address: string;
} | null;

let _result: MapResult = null;
let _listener: ((r: MapResult) => void) | null = null;

export const mapPickerStore = {
  set: (r: MapResult) => {
    _result = r;
    _listener?.(r);         // notify immediately if listener already attached
  },
  subscribe: (fn: ((r: MapResult) => void) | null) => {
    _listener = fn;
    if (fn && _result) {    // ← if data already arrived, fire immediately
      fn(_result);
    }
  },
  clear: () => {
    _result = null;
  },
};