/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import ChatInfo from '../ColumnRight/ChatInfo';
import { modalManager } from '../../Utils/Modal';
import ApplicationStore from '../../Stores/ApplicationStore';
import TdLibController from '../../Controllers/TdLibController'; 
import './ChatInfoDialog.css'; 
import { isAdmin } from '../../Utils/Chat';

class ChatInfoDialog extends React.Component {
    state = {
        chatId: ApplicationStore.dialogChatId, 
        permissions:null,
        admin:false
    };

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { chatId } = this.state;

        return nextState.chatId !== chatId; 
    }

    componentDidMount() { 
        ApplicationStore.on('clientUpdateDialogChatId', this.onClientUpdateDialogChatId);
        ApplicationStore.on('clientUpdateMediaViewerContent', this.onClientUpdateMediaViewerContent);
    }

    componentWillReceiveProps(nextProps) {
        let that = this;
        //let chatId = 1073742002;   
        const chatId1 = nextProps.chatId;  
        let chatId = Math.abs(chatId1);
        chatId = chatId.toString(); 
        chatId = chatId.slice(3); 
        chatId = parseInt(chatId); 
        let getAdmin = isAdmin(chatId1);
        that.setState({admin:getAdmin});
        TdLibController.send({
        '@type': 'sendCustomRequest',
        "method": "chats.getBannedRightex",
        "parameters":JSON.stringify({"chatId": chatId})
        })
        .then(data => { 
            if(data.result){
                let newResult = JSON.parse(data.result);  
                 that.setState({permissions:newResult.data ? newResult.data:{}})   
               
            } 
        })
        .catch(err => {  
            console.log("err on get permissions");
        });  
    }

    componentWillUnmount() {
        ApplicationStore.off('clientUpdateDialogChatId', this.onClientUpdateDialogChatId);
        ApplicationStore.off('clientUpdateMediaViewerContent', this.onClientUpdateMediaViewerContent);
    }

    onClientUpdateMediaViewerContent = update => {
        if (ApplicationStore.mediaViewerContent) {
            this.handleClose();
        }  
    };

    onClientUpdateDialogChatId = update => {
        const { chatId } = update;

        this.setState({ chatId });
    }; 

    handleClose = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateDialogChatId',
            chatId: 0
        });
    };

    render() {
        const { chatId } = this.state;
        if (!chatId) return null;  

        //获取群成员的扩展权限，判断群组是否限制可以查看个人信息等，
        //并且判断当前用户是否为管理员，如果是管理员则无视权限随时可以看，如果不是管理员
        //则需要根据群组权限 禁用查看个人信息、私聊等功能
        let gerPermissions = this.state.permissions;
        let getAdmin = this.state.admin;
        let isShow = false;
        if(gerPermissions){ 
            if(gerPermissions.banWhisper || gerPermissions.banSendDmMention){
                if(getAdmin){
                    isShow = true;
                }else{
                    isShow = false;
                }
            } 
        }
        if(isShow == false){
            return null;
        }else{
            return (
                <Dialog
                    open
                    manager={modalManager}
                    transitionDuration={0}
                    onClose={this.handleClose}
                    classes={{
                        root: 'chat-info-dialog-root',
                        container: 'chat-info-dialog-container',
                        paper: 'chat-info-dialog-paper'
                    }}>
                    <ChatInfo className='chat-info-dialog-content' chatId={chatId} popup />
                </Dialog>
            );
        }
       
    }
}

ChatInfoDialog.propTypes = {};

export default ChatInfoDialog;
