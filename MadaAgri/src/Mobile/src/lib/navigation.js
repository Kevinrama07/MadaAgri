import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  if (navigationRef && navigationRef.isReady && navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

export function navigateReset(routes) {
  if (navigationRef && navigationRef.isReady && navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes,
    });
  }
}
