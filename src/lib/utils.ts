import { Alert, Platform } from 'react-native'

// Alert.alert does nothing on web, so use the browser alert there
export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') {
    ;(globalThis as any).alert(message ? `${title}\n\n${message}` : title)
  } else {
    Alert.alert(title, message)
  }
}

export const webRedirect = (url: string) => {
  ;(globalThis as any).location.href = url
}

export const webOrigin = () => (globalThis as any).location.origin as string
