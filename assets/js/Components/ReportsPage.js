import React from 'react'
import { View } from '@instructure/ui-view'
import { Flex } from '@instructure/ui-flex'
import { Text } from '@instructure/ui-text'
import { Heading } from '@instructure/ui-heading'
import { IconDownloadLine } from '@instructure/ui-icons'

import Api from '../Services/Api'
import { Spinner } from '@instructure/ui-spinner'

import IssuesReport from './Reports/IssuesReport'
import ResolutionsReport from './Reports/ResolutionsReport'
import ReportsTable from './Reports/ReportsTable'
import IssuesTable from './Reports/IssuesTable'

class ReportsPage extends React.Component {
  constructor(props) {
    super(props)

    this.issues = this.processIssues(props.report)

    this.state = {
      reports: []
    }
  }

  componentDidMount() {
    if (this.state.reports.length === 0) {
      this.getReportHistory()
    }
  }

  componentDidUpdate() {
    this.issues = this.processIssues(this.props.report)
  }

  render() {
    if (this.state.reports.length === 0) {
      return (
        <View as="div" padding="small 0">
          <View as="div" textAlign="center" padding="medium">
            <Spinner variant="inverse" renderTitle={this.props.t('label.loading_reports')} />
            <Text as="p" weight="light" size="large">{this.props.t('label.loading_reports')}</Text>
          </View>
        </View>
      )
    } else {
      return (
        <View as="div" padding="small 0">
          <Heading>{this.props.t('label.reports')}</Heading>
          <View as="div" margin="0 0 large 0">
            <Flex justifyItems="space-between" alignItems="start">
              <Flex.Item width="48%" padding="0">
                <IssuesReport t={this.props.t} reports={this.state.reports} />
              </Flex.Item>
              <Flex.Item width="48%" padding="0">
                <ResolutionsReport t={this.props.t} reports={this.state.reports} />
              </Flex.Item>
            </Flex>
          </View>
          <View as="div" margin="large 0">
            <IssuesTable
              issues={this.issues}
              settings={this.props.settings}
              t={this.props.t} />
          </View>
          <View as="div" margin="large 0">
            <ReportsTable
              reports={this.state.reports}
              t={this.props.t}
            />
          </View>
        </View>
      )
    }
  }

  getReportHistory() {
    const api = new Api(this.props.settings)
    api.getReportHistory()
      .then((responseStr) => responseStr.json())
      .then((response) => {
        this.setState({reports: response.data})
      })
  }

  processIssues(report) {
    let rules = []

    for (let issue of report.issues) {
      const rule = issue.scanRuleId
      const status = issue.status
    
      if (!rules[rule]) {
        rules[rule] = {
          id: rule,
          type: issue.type,
          active: 0,
          fixed: 0,
          resolved: 0,
          total: 0
        }
      }

      if (2 === status) {
        rules[rule]['resolved']++
      }
      else if (1 === status) {
        rules[rule]['fixed']++
      }
      else {
        rules[rule]['active']++
      }
      rules[rule]['total']++
    }

    return rules
  }


}

export default ReportsPage