import React from 'react';
import { Modal } from '@instructure/ui-modal'
import { Heading } from '@instructure/ui-heading'
import { Button } from '@instructure/ui-buttons'
import { View } from '@instructure/ui-view'
import { Pill } from '@instructure/ui-pill'
import { Flex } from '@instructure/ui-flex'
import { CloseButton} from '@instructure/ui-buttons'
import { Text } from '@instructure/ui-text'
import { Link } from '@instructure/ui-link'
import { InlineList } from '@instructure/ui-list'
import { IconExternalLinkLine, IconCheckMarkLine } from '@instructure/ui-icons'
import { CodeEditor } from '@instructure/ui-code-editor'
import { Checkbox } from '@instructure/ui-checkbox'
import { Spinner } from '@instructure/ui-spinner'
import ReactHtmlParser from 'react-html-parser'
import MessageTray from './MessageTray'
import Preview from './Preview'
import { ToggleDetails } from '@instructure/ui-toggle-details'

import { returnIssueForm } from '../Services/Ufixit'
import Api from '../Services/Api'
import * as Html from '../Services/Html'

import Pretty from 'pretty'

class UfixitModal extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      windowContents: 'preview',
      expandExample: false,
      issueDetailsPending: true
    }

    this.modalMessages = []
    
    this.handleWindowToggle = this.handleWindowToggle.bind(this)
    this.addMessage = this.addMessage.bind(this)
    this.clearMessages = this.clearMessages.bind(this)
    this.handleIssueSave = this.handleIssueSave.bind(this)
    this.handleIssueResolve = this.handleIssueResolve.bind(this)
    this.handleOpenContent = this.handleOpenContent.bind(this)
    this.handleExampleToggle = this.handleExampleToggle.bind(this)
    this.handleManualScan = this.handleManualScan.bind(this)
  }

  componentDidMount() {
    this.syncIssue(this.props.activeIssue)
    console.log('mounting', this.props.activeIssue)
  }

  componentDidUpdate(prevProps, prevState) {
    console.log('updating 1', this.props.activeIssue)
    if (prevProps.activeIssue.id != this.props.activeIssue.id) {
      this.setState({
        windowContents: 'preview',
        expandExample: false,
        issueDetailsPending: true
      })

      console.log('updating 2', this.props.activeIssue)
      this.syncIssue(this.props.activeIssue)
    }
    console.log('updating 3', this.props.activeIssue)
  }

  findActiveIndex() {
    if (this.props.filteredRows && this.props.activeIssue) {
      for (const i in this.props.filteredRows) {
        let issue = this.props.filteredRows[i]
        if (issue.issue.id === this.props.activeIssue.id) {
          console.log('activeIssue', this.props.activeIssue)
          console.log('index', Number(i))
          return Number(i)
        }
      }
    }

    return 0;
  }

  // Handler for the previous and next buttons on the modal
  // Will wrap around if the index goes out of bounds
  handleIssueChange(newIndex) {
    if (newIndex < 0) {
      newIndex = this.props.filteredRows.length - 1
    }
    if (newIndex > (this.props.filteredRows.length - 1)) {
      newIndex = 0
    }
    this.clearMessages()
    this.setState({ issueDetailsPending: true })
    this.props.handleActiveIssue(this.props.filteredRows[newIndex].issue)
  }
  
  handleWindowToggle(val) {
    this.setState({windowContents: val})
  }

  handleOpenContent(e) {
    const contentItem = this.props.activeContentItem
    window.open(contentItem.url, '_blank', 'noopener,noreferrer')
  }

  render() {
    let UfixitForm
    const { activeIssue, activeContentItem } = this.props

    const pending = (this.props.activeIssue && (this.props.activeIssue.pending == '1'))

    let activeIndex = this.findActiveIndex();
    if (!this.state.issueDetailsPending) {
      UfixitForm = returnIssueForm(activeIssue)
    }

    let showExample = false
    if (!this.props.t(`rule.example.${activeIssue.scanRuleId}`).includes('rule.example')) {
      showExample = true
    }

    let code = this.prepareCode(activeIssue)

    return (
      <View>
        {this.props.open &&
        <Modal
          open={this.props.open}
          size="large"
          label={this.props.t('ufixit.modal.label')}>
          <Modal.Header padding="0 medium">
            <Flex>
              <Flex.Item shouldGrow shouldShrink>
                <Heading>{this.props.t(`rule.label.${activeIssue.scanRuleId}`)}</Heading>
              </Flex.Item>
              <Flex.Item>
                <CloseButton
                  placement="end"
                  offset="small"
                  screenReaderLabel="Close"
                  onClick={this.props.handleCloseButton}
                />
              </Flex.Item>
            </Flex> 
          </Modal.Header>
          <Modal.Body padding="small medium">
            <View as="div" minHeight="520px">
              <MessageTray messages={this.modalMessages} clearMessages={this.clearMessages} t={this.props.t} hasNewReport={true} />
              {this.state.issueDetailsPending &&
                <View as="div" textAlign="center" padding="large">
                  <Spinner renderTitle="Scanning" size="large" />
                </View>
              }
              {!this.state.issueDetailsPending && <View as="div">
                <View as="div" margin="small">
                  <View as="div" margin="small 0">
                    <Text lineHeight="default">
                      {ReactHtmlParser(this.props.t(`rule.desc.${activeIssue.scanRuleId}`), { preprocessNodes: (nodes) => Html.processStaticHtml(nodes, this.props.settings) })}
                    </Text>
                  </View>
                  {showExample &&
                    <ToggleDetails
                      summary={this.state.expandExample ? (this.props.t('label.btn.hide_example')) : (this.props.t('label.btn.show_example'))}
                      expanded={this.state.expandExample}
                      fluidWidth={true}
                      onToggle={this.handleExampleToggle}>
                      <View as="div" margin="small 0">
                      {ReactHtmlParser(this.props.t(`rule.example.${activeIssue.scanRuleId}`), { preprocessNodes: (nodes) => Html.processStaticHtml(nodes, this.props.settings) })}
                      </View>
                    </ToggleDetails>
                  }
                </View>
                <Flex justifyItems="space-between" alignItems="start">
                  <Flex.Item width="46%" padding="0">
                    <View as="div">
                      <UfixitForm activeIssue={activeIssue} t={this.props.t} settings={this.props.settings}
                        handleIssueSave={this.handleIssueSave}
                        addMessage={this.addMessage} 
                        handleActiveIssue={this.props.handleActiveIssue}
                        handleManualScan={this.handleManualScan} />
                    </View>
                    {('module' !== activeContentItem.contentType) &&
                      <View as="div" background="secondary" padding="medium" margin="small 0 0 x-small">
                        <Text as="div" weight="bold">{this.props.t('label.manual_resolution')}</Text>
                        <Text as="div" lineHeight="default">{this.props.t('label.resolved_description')}</Text>
                        <View as="div" padding="small 0 0 0">
                          {('2' == activeIssue.pending) ? 
                            <Spinner renderTitle={this.props.t('form.processing')} size="x-small" />
                            :
                            <Checkbox onChange={this.handleIssueResolve} label={this.props.t('label.mark_resolved')}
                              checked={(activeIssue.status == '2')} disabled={(activeIssue.status == '1')} />
                          }
                        </View>
                      </View>
                    }
                  </Flex.Item>
                  <Flex.Item width="50%" padding="0" overflowY="auto">
                    <View as="div" padding="x-small">
                      <InlineList delimiter="pipe">
                        <InlineList.Item>
                          {('preview' === this.state.windowContents) ?
                            <Text weight="bold">{this.props.t('label.preview')}</Text> 
                            :
                            <Link isWithinText={false} onClick={() => this.handleWindowToggle('preview')}>
                              {this.props.t('label.preview')}</Link>
                          }
                        </InlineList.Item>
                        <InlineList.Item>
                          {('html' === this.state.windowContents) ?
                            <Text weight="bold">{this.props.t('label.view_source')}</Text>
                            :
                            <Link isWithinText={false} onClick={() => this.handleWindowToggle('html')}>
                              {this.props.t('label.view_source')}</Link>
                          }
                        </InlineList.Item>
                      </InlineList>
                      <View as="div" shadow="resting" padding="small" margin="x-small 0 0 0" height="200px" overflowY="auto">
                        {('preview' === this.state.windowContents) &&       
                          <Preview
                            activeIssue={this.props.activeIssue}
                            settings={this.props.settings}
                          >  
                          </Preview>           
                        }
                        {('html' === this.state.windowContents) &&
                          <CodeEditor margin="x-small 0" label={this.props.t('label.code_preview')} language="html" readOnly={true}
                            value={code}
                            options={{ lineNumbers: true }} />
                        }
                      </View>
                    </View>
                    <View as="div" padding="0 x-small">
                      {/* <Text weight="bold">{this.props.t('label.source')}</Text> */}
                      {activeContentItem && 
                        <View as="div">                    
                          <Pill>{activeContentItem.contentType}</Pill>
                          <Link onClick={this.handleOpenContent} isWithinText={false} margin="small" renderIcon={<IconExternalLinkLine />} iconPlacement="end">
                              {activeContentItem.title}
                            </Link>
                        </View>
                      }
                    </View>
                  </Flex.Item>
                </Flex>
              </View>}
            </View>
          </Modal.Body>

          <Modal.Footer>
            <View width="100%">
              <Flex as="div" justifyItems="space-between" shouldGrow shouldShrink>
                <Flex.Item>
                  <InlineList delimiter="pipe">
                    <InlineList.Item>
                      {this.props.t('label.issue')} {(activeIndex + 1)} {this.props.t('label.of')} {this.props.filteredRows.length}
                    </InlineList.Item>
                    {activeIssue.status && !activeIssue.pending &&
                      <InlineList.Item>
                        {('1' == activeIssue.status) &&
                          <Pill color="success" margin="0 small">
                            <IconCheckMarkLine color="success" />
                            <View margin="0 x-small">{this.props.t('label.fixed')}</View>
                          </Pill>
                        }
                        {('2' == activeIssue.status) &&
                          <Pill color="info" margin="0 small">
                            <IconCheckMarkLine color="brand" />
                            <View margin="0 x-small">{this.props.t('label.resolved')}</View>
                          </Pill>
                        }
                      </InlineList.Item>
                    }
                  </InlineList>
                </Flex.Item>
                <Flex.Item>
                  <Button margin="0 small" interaction={(!pending) ? 'enabled' : 'disabled'} onClick={this.props.handleCloseButton}>{this.props.t('label.close')}</Button>
                  <Button margin="0 0 0 x-small" interaction={(!pending) ? 'enabled' : 'disabled'} onClick={() => this.handleIssueChange(activeIndex - 1)}>
                    {this.props.t('label.previous_issue')}
                  </Button>
                  <Button margin="0 0 0 x-small" interaction={(!pending) ? 'enabled' : 'disabled'} onClick={() => this.handleIssueChange(activeIndex + 1)}>
                    {this.props.t('label.next_issue')}
                  </Button>
                </Flex.Item>
              </Flex>            
            </View>
          </Modal.Footer>
        </Modal>
        }
      </View>)
  }

  prepareCode(activeIssue) {
    let sourceCode = (activeIssue.newHtml) ? activeIssue.newHtml : activeIssue.sourceHtml
    let code = sourceCode

    if (sourceCode.length === 0 || sourceCode.length > 3000) {
      code = '<span>Not Available</span>'
    } else {
        let element = Html.toElement(sourceCode)
        
        if(element && element.tagName === 'TH') {
          code = activeIssue.previewHtml
        }
    }
    return Pretty(code)
  }


  handleIssueResolve() {
    let activeIssue = Object.assign({}, this.props.activeIssue)
    if (activeIssue.pending) {
      return
    }

    if (activeIssue.status) {
      activeIssue.status = false
      activeIssue.newHtml = Html.toString(Html.removeClass(activeIssue.sourceHtml, 'phpally-ignore'))
    }
    else {
      activeIssue.status = 2
      activeIssue.newHtml = Html.toString(Html.addClass(activeIssue.sourceHtml, 'phpally-ignore'))
    }
    
    let api = new Api(this.props.settings)
    api.resolveIssue(activeIssue)
      .then((responseStr) => responseStr.json())
      .then((response) => {      
        // set messages 
        response.messages.forEach((msg) => this.addMessage(msg))
      
        if (Array.isArray(response.errors)) {
          response.errors.forEach((error) => {
            this.addMessage({
              severity: 'error',
              message: error
            })
          })

          activeIssue.status = false;
        }

        if (response.data.issue) {
          let newIssue = { ...activeIssue, ...response.data.issue }

          // update activeIssue
          newIssue.pending = false
          newIssue.recentlyResolved = !!activeIssue.status
          newIssue.sourceHtml = newIssue.newHtml
          newIssue.newHtml = ''

          this.props.handleActiveIssue(newIssue)
          this.props.handleIssueSave(newIssue, response.data)
        }
        else {
          activeIssue.pending = false
          this.props.handleActiveIssue(activeIssue)
        }
      })

    activeIssue.pending = 2
    this.props.handleActiveIssue(activeIssue)
  }

  handleIssueSave(issue) {
    // send issue obj to PHP
    let api = new Api(this.props.settings)

    console.log('issue before', issue)

    api.saveIssue(issue)
      .then((responseStr) => responseStr.json())
      .then((response) => {
        // set messages 
        response.messages.forEach((msg) => this.addMessage(msg))

        console.log('response', response)
        console.log('issue in call', issue)

        if (response.data.issue) {
          const newIssue = {...issue, ...response.data.issue}
          newIssue.pending = false
          newIssue.recentlyUpdated = true

          console.log('1', this.props.activeIssue)
          this.props.handleIssueSave(newIssue, response.data)
          console.log('2', this.props.activeIssue)
          this.props.handleActiveIssue(newIssue)
          console.log('3', this.props.activeIssue)
        }
        else {
          issue.pending = false
          this.props.handleActiveIssue(issue)
        }
      })

    // update activeIssue
    issue.pending = 1
    this.props.handleActiveIssue(issue)

    console.log('issue after', issue)
  }


  handleManualScan(issue) {
    let api = new Api(this.props.settings)
    api.scanIssue(issue.id)
      .then((response) => response.json())
      .then((data) => {
        if (data.messages) {
          data.messages.forEach((msg) => {
            if (msg.visible) {
              this.addMessage(msg);
            }
          });
        }
        if (data.data.issue) {
          const newIssue = { ...issue, ...data.data.issue }
          newIssue.pending = false
          newIssue.recentlyUpdated = true

          this.props.handleIssueSave(newIssue, data.data.report)

          // update activeIssue
          this.props.handleActiveIssue(newIssue)
        }
        else {
          issue.pending = false
          this.props.handleActiveIssue(issue)
        }
      })

    // update activeIssue
    issue.pending = 1
    this.props.handleActiveIssue(issue)
  }

  handleExampleToggle() {
    this.setState({expandExample: !this.state.expandExample})
  }
  
  addMessage = (msg) => {
    this.modalMessages.push(msg);
  }

  clearMessages() {
    this.modalMessages = [];
  }

  syncIssue(issue) {
    let api = new Api(this.props.settings)

    console.log('sync before call', issue)

    api.syncIssue(issue)
      .then((response) => response.json())
      .then((response) => {
        const newIssue = { ...issue, ...response.data }

        console.log('sync issue in call', newIssue)

        // set messages 
        response.messages.forEach((msg) => this.addMessage(msg))

        if (newIssue.id === this.props.activeIssue.id) {
          this.props.handleActiveIssue(newIssue)
          this.setState({ issueDetailsPending: false });
        }
      })

    console.log('sync after call', issue)
  }
}

export default UfixitModal;
