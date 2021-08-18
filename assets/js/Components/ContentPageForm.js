import React from 'react';
import { TextInput } from '@instructure/ui-text-input'
import { Button } from '@instructure/ui-buttons'
import { IconSearchLine, IconFilterLine } from '@instructure/ui-icons'
import { Flex } from '@instructure/ui-flex'
import { ScreenReaderContent } from '@instructure/ui-a11y-content'
import { SimpleSelect } from '@instructure/ui-simple-select'

class ContentPageForm extends React.Component {

  constructor(props) {
    super(props);

  }

  focus = () => {
    this.filterButton.focus()
  }

  render() {
    return (
      <Flex alignItems="center" justifyItems="space-between" key="contentPageForm">
        <Flex.Item>
        <Flex alignItems="end" width="36vw" justifyItems="space-between" padding="0 0 medium 0">
            <Flex.Item>
              <TextInput
                renderLabel={<ScreenReaderContent>Search Term</ScreenReaderContent>}
                renderBeforeInput={<IconSearchLine inline={false} />}
                placeholder={this.props.t('placeholder.keyword')}
                onChange={this.props.handleSearchTerm}
                value={this.props.searchTerm}
              />
            </Flex.Item>
          </Flex>
        </Flex.Item>
        <Flex.Item>
          {this.props.handleTrayToggle && 
            <Button
              renderIcon={IconFilterLine}
              screenReaderLabel={this.props.t('srlabel.open_filters_tray')}
              onClick={this.props.handleTrayToggle}
              elementRef={(node) => this.filterButton = node}
              >
              {this.props.t('label.filter')}
            </Button>}
        </Flex.Item>
      </Flex>
    );
  }
}

export default ContentPageForm;