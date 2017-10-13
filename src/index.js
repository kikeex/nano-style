import React from 'react'
import hash from './hash'
import parse from './parse'
import withTheme from './withTheme'
import Style from './Style'
import { PREFIX, CHANNEL } from './constants'

import StyleProvider from './StyleProvider'

const styled = Component => (...args) => {
  const staticStyles = args.filter(a => typeof a !== 'function')
    .reduce((a, b) => Object.assign(a, b), {})
  const dynamicStyles = args.filter(a => typeof a === 'function')
  const baseClassName = PREFIX + hash(JSON.stringify(staticStyles))
  const base = parse('.' + baseClassName, staticStyles)
  const isElement = typeof Component === 'string'

  // needs to check for missing Provider context
  const isRegistered = StyleProvider.registerCSS(baseClassName, base)

  class Styled extends React.Component {
    constructor (props, context) {
      super(props)

      this.getStyles = props => {
        const styles = dynamicStyles.map(fn => fn(props))
        const className = PREFIX + hash(JSON.stringify(styles))
        const css = styles.map(style => parse('.' + className, style)).join('')

        this.setState({
          className,
          css
        })
      }

      this.getProps = props => {
        if (!isElement) return props
        const next = {}
        const blacklist = [
          ...Object.keys(ThemeStyled.propTypes || {}),
          'theme'
        ]
        for (let key in props) {
          if (blacklist.includes(key)) continue
          next[key] = props[key]
        }
        if (props.className) next.className = '' + props.className

        return next
      }

      this.state = {
        className: '',
        css: ''
      }
    }

    componentWillMount () {
      this.getStyles(this.props)
    }

    componentWillReceiveProps (next) {
      if (next !== this.props) {
        this.getStyles(next)
      }
    }

    render () {
      const { css } = this.state
      const next = this.getProps(this.props)

      const className = [
        this.props.className,
        baseClassName,
        this.state.className
      ].join(' ').trim()

      return [
        !isRegistered && !!base && <Style key='base' css={base} />,
        !!css && <Style key='css' css={css} />,
        <Component
          {...next}
          key='Component'
          className={className}
        />
      ]
    }
  }

  Styled.defaultProps = {
    className: ''
  }

  const ThemeStyled = withTheme(Styled)

  return ThemeStyled
}

export default styled
export { default as Provider } from './Provider'
