import * as React from 'react'
import { Box } from '@chakra-ui/react'

export const Separator = React.forwardRef(function Separator(props, ref) {
  const { 
    orientation = 'horizontal',
    size = '1px',
    variant = 'solid',
    colorScheme = 'gray',
    ...rest 
  } = props

  const isHorizontal = orientation === 'horizontal'

  const styles = {
    solid: {
      background: `var(--chakra-colors-${colorScheme}-200)`,
    },
    dashed: {
      background: 'transparent',
      borderStyle: 'dashed',
      borderColor: `var(--chakra-colors-${colorScheme}-200)`,
      borderWidth: size,
    },
    dotted: {
      background: 'transparent',
      borderStyle: 'dotted',
      borderColor: `var(--chakra-colors-${colorScheme}-200)`,
      borderWidth: size,
    },
  }

  return (
    <Box
      ref={ref}
      role="separator"
      aria-orientation={orientation}
      width={isHorizontal ? 'full' : size}
      height={isHorizontal ? size : 'full'}
      {...styles[variant]}
      {...rest}
    />
  )
})
