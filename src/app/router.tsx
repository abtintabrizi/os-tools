import { createBrowserRouter } from 'react-router-dom'
import Home from '@/routes/Home'
import MapDraft from '@/routes/MapDraft'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/map-draft',
    element: <MapDraft />,
  },
])