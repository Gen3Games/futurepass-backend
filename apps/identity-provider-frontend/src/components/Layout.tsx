import React from 'react'

export const Page: React.FC<{
  children?: React.ReactElement | React.ReactElement[]
}> = ({ children }) => {
  return <div className="main-wrapper">{children}</div>
}

export default Page
