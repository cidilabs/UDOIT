import React from 'react';
import { Table } from '@instructure/ui-table'
import { Pagination } from '@instructure/ui-pagination'
import { View } from '@instructure/ui-view'
import { SimpleSelect } from '@instructure/ui-simple-select'
import { Billboard } from '@instructure/ui-billboard'
import { Flex } from '@instructure/ui-flex'
import { Text } from '@instructure/ui-text'
import { ScreenReaderContent } from '@instructure/ui-a11y-content'

class SortableTable extends React.Component {
    constructor (props) {
      super(props);
    }
  
    handleSort = (event, { id }) => {
      const { sortBy, ascending } = this.props.tableSettings;

      if (['status', 'action'].includes(id)) {
        return;
      }

      if (id === sortBy) {
        this.props.handleTableSettings({ascending: !ascending});
      } else {
        this.props.handleTableSettings({
          ascending: true,
          sortBy: id
        });
      }
    }
  
    render() {
      this.rowsPerPage = (this.props.rowsPerPage) ? parseInt(this.props.rowsPerPage) : 10;
      const options = ['10', '25', '50'];
      const { caption, headers, rows } = this.props
      const start = (this.props.tableSettings.pageNum * this.rowsPerPage)
      const { sortBy, ascending } = this.props.tableSettings
      const direction = (ascending) ? 'ascending': 'descending'
      let pagedRows = rows.slice(start, (start + this.rowsPerPage))
      let pagination = this.renderPagination()

      return (
        <View as="div">
          <Table
            caption={caption}
            hover={true}
          >
            <Table.Head renderSortLabel={this.props.t('table.sort_by')}>
              <Table.Row>
                {(headers || []).map(({ id, text }) => (
                  (text) ? 
                    <Table.ColHeader
                      key={`header${id}`}
                      id={id}
                      onRequestSort={this.handleSort}
                      textAlign="start"
                      sortDirection={id === sortBy ? direction : 'none'}
                    >{text}</Table.ColHeader>
                      :
                    <Table.ColHeader key={`header${id}`} id={id} />
                  ))}
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {pagedRows.map((row) => (
                <Table.Row key={`row${row.id}`}>
                  {headers.map(({ id, renderCell, alignText, format }) => (
                    <Table.Cell key={`row${row.id}cell${id}`} textAlign={alignText ? alignText : 'start'} onClick={(row.onClick) ? row.onClick : null}>
                      {renderCell ? renderCell(row[id]) : (format) ? format(row[id]) : <View as="div" cursor={(row.onClick) ? 'pointer' : 'auto'}>{row[id]}</View>}
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
          {this.props.rows.length === 0 && 
            <Billboard
            size="medium"
            heading={this.props.t('label.no_results_header')}
            margin="small"
            message={this.props.t('label.no_results_message')}
          />}
          <Flex margin="small" align="center" width="50vw" justifyItems="space-between">
            <Flex.Item>
              <Flex>
                <Flex.Item>
                  <View as="div">
                    <SimpleSelect
                      renderLabel=""
                      assistiveText="Use arrow keys to navigate options."
                      value={this.props.tableSettings.rowsPerPage}
                      onChange={(e, { id, value }) => {
                        this.props.handleTableSettings({
                          rowsPerPage: value
                        })
                        localStorage.setItem('rowsPerPage', value)
                      }}
                      width="13vw"
                      size="small"
                      margin="medium"
                      >
                      {options.map((opt, index) => (
                        <SimpleSelect.Option
                          key={index}
                          id={`opt-${index}`}
                          value={opt}
                          >
                          { opt }
                        </SimpleSelect.Option>
                      ))}
                    </SimpleSelect>
                    <ScreenReaderContent>{this.props.t('label.table_rows_select')}</ScreenReaderContent>
                  </View>
                </Flex.Item>
                <Flex.Item margin="small">
                  <Text weight="bold">{this.props.t('label.table_rows_select')}</Text>
                </Flex.Item>
              </Flex>
            </Flex.Item>
            <Flex.Item>
              {pagination}
            </Flex.Item>
          </Flex>
        </View>
      )
    }

    setPage(i) {
      this.props.handleTableSettings({pageNum: i});
    }

    renderPagination() {
      const pageCount = this.rowsPerPage && Math.ceil(this.props.rows.length / this.rowsPerPage);
      const pages = Array.from(Array(pageCount)).map((v, i) => <Pagination.Page
        key={`page${i}`}
        onClick={() => this.setPage(i)}
        current={i === this.props.tableSettings.pageNum}>
        {i + 1}
      </Pagination.Page>)

      return (pageCount > 1) && (
        <Pagination
          as="nav"
          margin="small"
          variant="compact"
          labelNext={this.props.t('table.next_page')}
          labelPrev={this.props.t('table.prev_page')}
        >
          {pages}
        </Pagination>
      )
    }
  }

  export default SortableTable;