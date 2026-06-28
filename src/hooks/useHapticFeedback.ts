/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';

export type HapticPattern = 
  | 'light' 
  | 'medium' 
  | 'heavy' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'selection' 
  | 'double';

export const useHapticFeedback = () => {
  const triggerHaptic = useCallback((pattern: HapticPattern | number | number[] = 'light') => {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
      return false;
    }

    try {
      const storedIntensity = localStorage.getItem('connectx_haptic_intensity') || 'medium';
      
      if (storedIntensity === 'off') {
        return false;
      }

      // Helper to scale single number or arrays
      const scaleDuration = (val: number, factor: number) => {
        return Math.max(1, Math.round(val * factor));
      };

      const scalePattern = (p: number | number[], factor: number): number | number[] => {
        if (typeof p === 'number') {
          return scaleDuration(p, factor);
        }
        return p.map(v => scaleDuration(v, factor));
      };

      if (storedIntensity === 'light') {
        if (typeof pattern === 'number' || Array.isArray(pattern)) {
          return navigator.vibrate(scalePattern(pattern, 0.5));
        }

        switch (pattern) {
          case 'light':
          case 'selection':
            return navigator.vibrate(5);
          case 'medium':
            return navigator.vibrate(12);
          case 'heavy':
            return navigator.vibrate(25);
          case 'double':
            return navigator.vibrate([8, 15, 8]);
          case 'success':
            return navigator.vibrate([15, 25, 15]);
          case 'warning':
            return navigator.vibrate([30, 30, 30]);
          case 'error':
            return navigator.vibrate([40, 20, 40, 20, 60]);
          default:
            return navigator.vibrate(8);
        }
      }

      if (storedIntensity === 'heavy') {
        if (typeof pattern === 'number' || Array.isArray(pattern)) {
          return navigator.vibrate(scalePattern(pattern, 1.6));
        }

        switch (pattern) {
          case 'light':
          case 'selection':
            return navigator.vibrate(18);
          case 'medium':
            return navigator.vibrate(45);
          case 'heavy':
            return navigator.vibrate(85);
          case 'double':
            return navigator.vibrate([25, 45, 25]);
          case 'success':
            return navigator.vibrate([55, 75, 55]);
          case 'warning':
            return navigator.vibrate([90, 80, 90]);
          case 'error':
            return navigator.vibrate([120, 60, 120, 60, 180]);
          default:
            return navigator.vibrate(25);
        }
      }

      // Default: 'medium' intensity (standard durations)
      if (typeof pattern === 'number' || Array.isArray(pattern)) {
        return navigator.vibrate(pattern);
      }

      switch (pattern) {
        case 'light':
        case 'selection':
          return navigator.vibrate(10);
        case 'medium':
          return navigator.vibrate(25);
        case 'heavy':
          return navigator.vibrate(55);
        case 'double':
          return navigator.vibrate([15, 30, 15]);
        case 'success':
          return navigator.vibrate([35, 50, 35]);
        case 'warning':
          return navigator.vibrate([60, 60, 60]);
        case 'error':
          return navigator.vibrate([90, 40, 90, 40, 120]);
        default:
          return navigator.vibrate(15);
      }
    } catch (error) {
      console.warn('Tactile haptic feedback not sustained by user agent/hardware environment:', error);
      return false;
    }
  }, []);

  return triggerHaptic;
};
