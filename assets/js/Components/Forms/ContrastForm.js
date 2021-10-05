import React from 'react'
import { Alert } from '@instructure/ui-alerts'
import { Button } from '@instructure/ui-buttons'
import { Spinner } from '@instructure/ui-spinner'
import { Flex } from '@instructure/ui-flex'
import { View } from '@instructure/ui-view'
import { Text } from '@instructure/ui-text'
import { TextInput } from '@instructure/ui-text-input'
import { Checkbox } from '@instructure/ui-checkbox'
import { IconButton } from '@instructure/ui-buttons'
import { IconArrowOpenDownSolid, IconArrowOpenUpSolid, IconCheckMarkLine } from '@instructure/ui-icons'
import ColorPicker from '../ColorPicker'
import Html from '../../Services/Html'
import Contrast from '../../Services/Contrast'

export default class ContrastForm extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      backgroundColor: this.getBackgroundColor(),
      textColor: this.getTextColor(),
      useBold: this.isBold(),
      useItalics: this.isItalicized(),
      contrastRatio: null,
      ratioIsValid: false,
      textInputErrors: [],
      checkboxErrors: []
    }

    this.formErrors = []

    this.handleInputBackground = this.handleInputBackground.bind(this)
    this.handleInputText = this.handleInputText.bind(this)
    this.handleLightenBackground = this.handleLightenBackground.bind(this)
    this.handleDarkenBackground = this.handleDarkenBackground.bind(this)
    this.handleLightenText = this.handleLightenText.bind(this)
    this.handleDarkenText = this.handleDarkenText.bind(this)
    this.handleBoldToggle = this.handleBoldToggle.bind(this)
    this.handleItalicsToggle = this.handleItalicsToggle.bind(this)
    this.updatePreview = this.updatePreview.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.updateText = this.updateText.bind(this)
    this.updateBackground = this.updateBackground.bind(this)
  }

  componentDidMount(prevProps, prevState) {
    this.updatePreview()
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.activeIssue !== this.props.activeIssue) {

      this.setState({
        backgroundColor: this.getBackgroundColor(),
        textColor: this.getTextColor(),
        useBold: this.isBold(),
        useItalics: this.isItalicized(),
        textInputErrors: [],
        checkBoxErrors: []
      },() => {
        this.formErrors = []
        this.updatePreview()
      })
    }
  }

  handleInputBackground(event, value) {
    this.setState({
      backgroundColor: value
    }, () => {
      this.updatePreview()
    })
  }

  handleInputText(event, value) {
    this.setState({
      textColor: value
    }, () => {
      this.updatePreview()
    })
  }

  handleLightenBackground() {
    this.setState({
      backgroundColor: Contrast.changehue(this.state.backgroundColor, 'lighten')
    }, () => {
      this.updatePreview()
    })
  }

  handleDarkenBackground() {
    this.setState({
      backgroundColor: Contrast.changehue(this.state.backgroundColor, 'darken')
    }, () => {
      this.updatePreview()
    })
  }

  handleLightenText() {
    this.setState({
      textColor: Contrast.changehue(this.state.textColor, 'lighten')
    }, () => {
      this.updatePreview()
    })
  }

  handleDarkenText() {
    this.setState({
      textColor: Contrast.changehue(this.state.textColor, 'darken')
    }, () => {
      this.updatePreview()
    })
  }

  handleBoldToggle() {
    this.setState({
      useBold: !this.state.useBold
    }, () => {
      this.updatePreview()
    })
  }

  handleItalicsToggle() {
    this.setState({
      useItalics: !this.state.useItalics
    }, () => {
      this.updatePreview()
    })
  }

  handleSubmit() {
    let issue = this.props.activeIssue
    let cssEmphasisIsValid = this.cssEmphasisIsValid(issue)

    if(this.state.ratioIsValid && cssEmphasisIsValid) {
      let issue = this.props.activeIssue
      issue.newHtml = Contrast.convertHtmlRgb2Hex(issue.newHtml)
      this.props.handleIssueSave(issue)
    } else {
      //push errors
      if(!this.state.ratioIsValid) {
        this.formErrors = []
        this.formErrors.push({ text: `${this.props.t('form.contrast.invalid')}: ${this.state.contrastRatio}` , type: 'error' })

        this.setState({
          textInputErrors: this.formErrors
        })
      }

      if(!cssEmphasisIsValid) {
        this.formErrors = []
        this.formErrors.push({ text: `${this.props.t('form.contrast.must_select')}` , type: 'error' })

        this.setState({
          checkboxErrors: this.formErrors
        })
      }
    }
  }

  updateText(value) {
    this.setState({
      textColor: value
    }, () => {
      this.updatePreview()
    })
  }

  updateBackground(value) {
    this.setState({
      backgroundColor: value
    }, () => {
      this.updatePreview()
    })
  }

  render() {
    const pending = (this.props.activeIssue && (this.props.activeIssue.pending == '1'))
    const buttonLabel = (pending) ? 'form.processing' : 'form.submit'
    const ratioColor = (this.state.ratioIsValid) ? 'success' : 'danger'

    const colors = [
      // top row (lighter)
      'FFFFFF',
      'E4E4E4',
      'FCFAC6',
      'DFF1D1',
      'DDF9E7',
      'DBE9F7',
      'E5EEF6',
      'F7E0F6',
      'F8EBEC',
      'F8E5D8',
      'F6E5CF',
      // bottom row (darker)
      '000000',
      '2D3B45',
      '7B7A30',
      '528328',
      '13803F',
      '225E9D',
      '2463CE',
      '80227D',
      'DC3545',
      'D04920',
      'BF590A',
    ];

    return (
      <View as="div" padding="0 x-small">
        <div id="flash-messages" role="alert"></div>
        <Alert 
          liveRegion={() => document.getElementById('flash-messages')}
          liveRegionPoliteness="polite"
          screenReaderOnly
        >
          {this.props.t('form.contrast_ratio')}: {this.state.contrastRatio}
        </Alert>
        <View as="div" padding="x-small 0">
          <TextInput
            renderLabel={this.props.t('form.contrast.replace_background')}
            placeholder={this.state.backgroundColor}
            value={this.state.backgroundColor}
            onChange={this.handleInputBackground}
            renderBeforeInput={
              <span style={{ boxShadow: '0 0 5px 0 #CCC', backgroundColor: Contrast.convertShortenedHex(this.state.backgroundColor), width: '20px', height: '20px', opacity: 1.0, display: 'inline-block' }}></span>
            }
            renderAfterInput={
              <View>
                <IconButton withBackground={false} withBorder={false}
                  onClick={this.handleDarkenBackground}
                  screenReaderLabel={this.props.t('form.contrast.darken')}>
                  <IconArrowOpenDownSolid color="primary" size="x-small" />
                </IconButton>
                <IconButton withBackground={false} withBorder={false}
                  onClick={this.handleLightenBackground}
                  screenReaderLabel={this.props.t('form.contrast.lighten')}>
                  <IconArrowOpenUpSolid color="primary" size="x-small" />
                </IconButton>
              </View>
            }
          />
          <ColorPicker
            update={this.updateBackground}
            colors={colors}
            t={this.props.t}
          />
        </View>
        <View as="div" padding="x-small 0">
          <TextInput
            renderLabel={this.props.t('form.contrast.replace_text')}
            placeholder={this.state.textColor}
            value={this.state.textColor}
            onChange={this.handleInputText}
            messages={this.state.textInputErrors}
            renderBeforeInput={
              <div style={{ boxShadow: '0 0 5px 0 #CCC', backgroundColor: Contrast.convertShortenedHex(this.state.textColor), width: '20px', height: '20px', opacity: 1.0 }}></div>
            }
            renderAfterInput={
              <View>
                <IconButton withBackground={false} withBorder={false}
                  onClick={this.handleDarkenText}
                  screenReaderLabel={this.props.t('form.contrast.darken')}>
                  <IconArrowOpenDownSolid color="primary" size="x-small" />
                </IconButton>
                <IconButton withBackground={false} withBorder={false}
                  onClick={this.handleLightenText}
                  screenReaderLabel={this.props.t('form.contrast.lighten')}>
                  <IconArrowOpenUpSolid color="primary" size="x-small" />
                </IconButton>
              </View>
            }
          />
          <ColorPicker
            update={this.updateText}
            colors={colors}
            t={this.props.t}
          />
        </View>
        <Flex>
          <Flex.Item shouldGrow shouldShrink>
            <View as="div" margin="small 0">
              <Checkbox label={this.props.t('form.contrast.bolden_text')}
                checked={this.state.useBold}
                onChange={this.handleBoldToggle}>
              </Checkbox>
            </View>

            <View as="div" margin="small 0">
              <Checkbox label={this.props.t('form.contrast.italicize_text')}
                checked={this.state.useItalics}
                onChange={this.handleItalicsToggle}
                messages={this.state.checkboxErrors}>
              </Checkbox>
            </View>

            <View as="div" margin="medium 0">
              <Button color="primary" onClick={this.handleSubmit} interaction={(!pending && this.props.activeIssue.status !== 2) ? 'enabled' : 'disabled'}>
                {('1' == pending) && <Spinner size="x-small" renderTitle={buttonLabel} />}
                {this.props.t(buttonLabel)}
              </Button>
              {this.props.activeIssue.recentlyUpdated &&
                <View margin="0 small">
                  <IconCheckMarkLine color="success" />
                  <View margin="0 x-small">{this.props.t('label.fixed')}</View>
                </View>
              }
            </View>
          </Flex.Item>
          <Flex.Item>
            <View as="div" padding="x-small 0">
              <Text weight="bold">{this.props.t('form.contrast_ratio')}</Text>
              <View as="div" width="120px" margin="x-small 0" textAlign="center" padding="small 0" borderColor={ratioColor} borderWidth="small">
                <Text color={ratioColor} as="div" size="x-large">{this.state.contrastRatio}</Text>
                {(this.state.ratioIsValid) ?
                  <View as="div" padding="x-small 0">
                    <Text size="x-small" color={ratioColor}>{this.props.t('form.contrast.valid')}</Text>
                  </View>
                  :
                  <View as="div" padding="x-small 0">
                    <Text size="x-small" color={ratioColor}>{this.props.t('form.contrast.invalid')}</Text>
                  </View>
                }
              </View>
            </View>
          </Flex.Item>
        </Flex>        
      </View>
    );
  }

  processHtml(html) {
    let element = Html.toElement(html)

    element.style.backgroundColor = Contrast.convertShortenedHex(this.state.backgroundColor)
    element.style.color = Contrast.convertShortenedHex(this.state.textColor)

    // Clean up tags
    Html.removeTag(element, 'strong')
    Html.removeTag(element, 'em')

    element.innerHTML = (this.state.useBold) ? `<strong>${element.innerHTML}</strong>` : element.innerHTML
    element.innerHTML = (this.state.useItalics) ? `<em>${element.innerHTML}</em>` : element.innerHTML
    
    return Html.toString(element)
  }

  updatePreview() {
    let issue = this.props.activeIssue
    const html = Html.getIssueHtml(this.props.activeIssue)
    let contrastRatio = Contrast.contrastRatio(this.state.backgroundColor, this.state.textColor)
    let tagName = Html.toElement(html).tagName
    let largeTextTags = this.props.t('form.contrast.large_text_tags')
    let ratioIsValid = this.state.ratioIsValid
    
    if(largeTextTags.includes(tagName)) {
      ratioIsValid = (contrastRatio >= 3)
    } else {
      ratioIsValid = (contrastRatio >= 4.5)
    }

    this.setState({ contrastRatio, ratioIsValid })

    issue.newHtml = this.processHtml(html)
    this.props.handleActiveIssue(issue)
  }

  isBold()
  {
    const issue = this.props.activeIssue
    const metadata = (issue.metadata) ? JSON.parse(issue.metadata) : {}
    const html = Html.getIssueHtml(this.props.activeIssue)
    const element = Html.toElement(html)

    return ((Html.hasTag(element, 'strong')) || (metadata.fontWeight === 'bold'))
  }

  isItalicized()
  {
    const issue = this.props.activeIssue
    const metadata = (issue.metadata) ? JSON.parse(issue.metadata) : {}
    const html = Html.getIssueHtml(this.props.activeIssue)
    const element = Html.toElement(html)

    return ((Html.hasTag(element, 'em')) || (metadata.fontStyle == 'italic'))
  }

  getBackgroundColor()
  {
    const issue = this.props.activeIssue
    const metadata = (issue.metadata) ? JSON.parse(issue.metadata) : {}
    const html = Html.getIssueHtml(this.props.activeIssue)
    const element = Html.toElement(html)

    if (element.style.backgroundColor) {
      return Contrast.standardizeColor(element.style.backgroundColor)
    } 
    else {
      return (metadata.backgroundColor) ? Contrast.standardizeColor(metadata.backgroundColor) : this.props.settings.backgroundColor
    }
  }

  getTextColor()
  {
    const issue = this.props.activeIssue
    const metadata = (issue.metadata) ? JSON.parse(issue.metadata) : {}
    const html = Html.getIssueHtml(this.props.activeIssue)
    const element = Html.toElement(html)

    if (element.style.color) {
      return Contrast.standardizeColor(element.style.color)
    }
    else {
      return (metadata.color) ? Contrast.standardizeColor(metadata.color) : this.props.settings.textColor
    }
  }

  cssEmphasisIsValid(issue) {
    if(issue.scanRuleId === 'CssTextStyleEmphasize') {
      if(!this.state.useBold && !this.state.useItalics) {
        return false
      }
    }
    return true
  }
}