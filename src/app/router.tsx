import { createBrowserRouter } from 'react-router-dom'
import Home from '@/routes/Home'
import MapDrafter from '@/routes/MapDrafter'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/map-draft',
    element: <MapDrafter />,
  },
])