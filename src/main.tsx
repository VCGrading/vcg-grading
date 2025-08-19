import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App'
import Landing from './pages/Landing'
import Verify from './pages/Verify'
import Account from './pages/Account'
import OrderNew from './pages/OrderNew'
import OrderAddress from './pages/OrderAddress'
import OrderDetails from './pages/OrderDetails'
import NotFound from './pages/NotFound'
import { I18nProvider } from './i18n'
import Login from './pages/Login'
import { AuthProvider } from './auth/AuthProvider'
import AuthCallback from './pages/AuthCallback'
import AdminOrders from './pages/admin/AdminOrders' // <-- ajouté

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'login', element: <Login /> },
      { path: 'auth/callback', element: <AuthCallback /> },
      { path: 'verify', element: <Verify /> },
      { path: 'verify/:certId', element: <Verify /> },
      { path: 'account', element: <Account /> },
      { path: 'order/new', element: <OrderNew /> },
      { path: 'order/address', element: <OrderAddress /> },
      { path: 'orders/:orderId', element: <OrderDetails /> },
      { path: 'admin', element: <AdminOrders /> }, // <-- ajouté
      { path: '*', element: <NotFound /> },
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </I18nProvider>
  </React.StrictMode>
)
