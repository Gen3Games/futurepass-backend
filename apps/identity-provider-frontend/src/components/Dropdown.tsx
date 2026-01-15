import { cn } from '@futureverse/component-library'
import React, { useState } from 'react'

type DropdownProps = {
  label?: string
  options: string[]
  selectedValue: string
  onChange: (value: string) => void
}

const Dropdown: React.FC<DropdownProps> = ({
  label,
  options,
  selectedValue,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelectChange = React.useCallback(
    (value: string) => {
      onChange(value)
      setIsOpen(false)
    },
    [onChange]
  )

  return (
    <div id="dropdown" className="dropdown relative w-[85px]">
      {label && (
        <label
          id="dropdown__label_text"
          className="dropdown__label_text absolute -top-2.5 mx-3 px-1.5 bg-black text-colorPrimary text-fontExtraSmall z-10"
        >
          {label}
        </label>
      )}
      <div className="dropdown__label relative">
        <div
          onClick={() => setIsOpen(!isOpen)}
          id="dropdown__input"
          className="dropdown__input relative cursor-pointer"
          tabIndex={0}
          onBlur={() => setIsOpen(false)}
        >
          <div className="block appearance-none w-full bg-transparent h-[48px] border border-colorTertiary text-colorPrimary px-4 py-2 pr-8 rounded leading-tight focus:outline-none focus:shadow-outline">
            <div
              id="dropdown__input_value"
              className="dropdown__input_value mt-2"
            >
              +{selectedValue}
            </div>
            <div
              id="dropdown__input_icon"
              className="dropdown__input_icon pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-colorPrimary focus::bg-red-500"
            >
              <svg
                className={cn('fill-current h-4 w-4', {
                  '-rotate-180 mt-1': isOpen,
                })}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M7 10l5 5 5-5H7z" />
              </svg>
            </div>
          </div>
          {isOpen && (
            <ul
              id="dropdown__list"
              className="dropdown__list absolute z-10 w-full bg-transparent mt-1 rounded-b shadow-lg max-h-64 overflow-y-auto"
            >
              {options.map((option) => (
                <li
                  key={option}
                  id="dropdown__list_item"
                  className={`dropdown__list_item px-4 py-2 cursor-pointer hover:bg-gray-700 ${
                    option === selectedValue ? 'bg-gray-700' : ''
                  }`}
                  onClick={() => handleSelectChange(option)}
                >
                  +{option}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dropdown
