export const metadata = {
  title: 'FarmScan Worker',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FarmScan',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function WorkerLayout({ children }) {
  return children;
}
