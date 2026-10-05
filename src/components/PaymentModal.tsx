type Props = { url: string | null; onClose: () => void; onCallback: (url: string) => void }

// On web we redirect to Paystack instead, so this renders nothing
export default function PaymentModal(_props: Props) {
  return null
}
