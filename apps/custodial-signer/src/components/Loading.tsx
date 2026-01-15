import React from 'react'

export function Loading() {
  return (
    <div className="h-screen w-screen flex flex-col justify-center items-center">
      <div id="loader" className="loader mx-auto self-center" />
    </div>
  )
}
