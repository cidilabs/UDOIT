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
    }

    render() {

        const metadata = (this.props.activeIssue.metadata) ? JSON.parse(this.props.activeIssue.metadata) : {}

        return (
            <View as="div" padding="0 x-small">
                Ipsum was found {metadata.wordCount} times
            </View>
        );
    }
}