import * as React from 'react'
import { Badge as ChakraBadge } from '@chakra-ui/react'

export const Badge = React.forwardRef(function Badge(props, ref) {
  const { 
    variant = 'solid',
    size = 'md',
    colorScheme = 'gray',
    children,
    ...rest 
  } = props

  return (
    <ChakraBadge
      ref={ref}
      variant={variant}
      colorScheme={colorScheme}
      px={size === 'sm' ? 2 : size === 'md' ? 2.5 : 3} 
      py={size === 'sm' ? 0.5 : size === 'md' ? 1 : 1.5}
      fontSize={size === 'sm' ? 'xs' : size === 'md' ? 'sm' : 'md'}
      borderRadius="full"
      textTransform="none"
      fontWeight="medium"
      whiteSpace="nowrap"
      {...rest}
    >
      {children}
    </ChakraBadge>
  )
})
