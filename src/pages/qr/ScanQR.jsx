import QRScanner from '../../components/qr/QRScanner'

export default function ScanQR() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Scan QR</h1>
      <QRScanner />
    </div>
  )
}
