import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useApp } from '../../lib/AppContext'

export default function TabsLayout() {
  const { cartCount } = useApp()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#e11d48',
        headerStyle: { backgroundColor: '#fff1f2' },
        headerTitleStyle: { color: '#be123c', fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '🍰 Sweet Treats',
          tabBarLabel: 'Shop',
          tabBarIcon: ({ color, size }) => <Ionicons name="storefront-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Your Cart',
          tabBarLabel: 'Cart',
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#e11d48' },
          tabBarIcon: ({ color, size }) => <Ionicons name="cart-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  )
}
