import React from "react"

import Footer from "@/modules/layout/templates/footer"
import { NavigationHeader } from "@/modules/layout/templates/nav"

const Layout: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <div className="w-full min-w-0 max-w-full overflow-x-clip">
      <NavigationHeader />
      <main className="relative w-full min-w-0 max-w-full">{children}</main>
      <Footer />
    </div>
  )
}

export default Layout
