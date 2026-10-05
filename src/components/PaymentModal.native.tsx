import { Modal, Pressable, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { WebView } from 'react-native-webview'

type Props = { url: string | null; onClose: () => void; onCallback: (url: string) => void }

export default function PaymentModal({ url, onClose, onCallback }: Props) {
  return (
    <Modal visible={!!url} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1 }}>
        <Pressable onPress={onClose} style={{ padding: 14 }}>
          <Text style={{ color: '#e11d48', fontWeight: '600' }}>✕ Cancel payment</Text>
        </Pressable>
        {url && (
          <WebView
            source={{ uri: url }}
            onShouldStartLoadWithRequest={(req) => {
              if (req.url.includes('/payment/callback')) {
                onCallback(req.url)
                return false
              }
              return true
            }}
          />
        )}
      </SafeAreaView>
    </Modal>
  )
}
