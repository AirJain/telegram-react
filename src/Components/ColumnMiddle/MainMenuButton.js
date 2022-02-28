/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { withTranslation } from 'react-i18next';
import IconButton from '@material-ui/core/IconButton';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import AddMemberIcon from '../../Assets/Icons/AddMember';
import BroomIcon from '../../Assets/Icons/Broom';
import DeleteIcon from '../../Assets/Icons/Delete';
import MoreVertIcon from '../../Assets/Icons/More';
import RemoveMemberIcon from '../../Assets/Icons/RemoveMember';
import UnpinIcon from '../../Assets/Icons/PinOff';
import UserIcon from '../../Assets/Icons/User';
import GroupIcon from '../../Assets/Icons/Group';
import { requestUnpinMessage } from '../../Actions/Client';
import { clearHistory, leaveChat } from '../../Actions/Chat';
import { canClearHistory, canDeleteChat, getViewInfoTitle, isPrivateChat, getDeleteChatTitle, hasOnePinnedMessage, canSwitchBlocked, getChatSender } from '../../Utils/Chat';
import { requestBlockSender, unblockSender } from '../../Actions/Message';
import AppStore from '../../Stores/ApplicationStore';
import ChatStore from '../../Stores/ChatStore';
import MessageStore from '../../Stores/MessageStore';
import TdLibController from '../../Controllers/TdLibController';
import './MainMenuButton.css';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import { modalManager } from '../../Utils/Modal'; 
import Switch from '@material-ui/core/Switch';
import Divider from '@material-ui/core/Divider';  
import { isAdmin } from '../../Utils/Chat';  
import { bool } from 'prop-types';
class MainMenuButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          openDialogs: false,
          permissionsDialog:false,
          checkedPublic:false,  
          admin:null,
          permissions:{
            banSendDmMention: false,
            banSendKeyword: false,
            banSendQRcode: false,
            banSendWebLink: false,
            banWhisper: false,
            kickWhoSendKeyword: false,
            showKickMessage: false,
          },
          
        };
    }
    state = {
        anchorEl: null
    };

    handleButtonClick = async event => {
        const { currentTarget: anchorEl } = event;

        const chatId = AppStore.getChatId();
        const chat = await TdLibController.send({ '@type': 'getChat', chat_id: chatId });
        ChatStore.set(chat);

        this.setState({ anchorEl });
    };

    handleMenuClose = () => {
        this.setState({ anchorEl: null });
    };

    handleChatInfo = () => {
        this.handleMenuClose();
        setTimeout(() => this.props.openChatDetails(), 150);
    }; 

    handleManageGroupClose = () =>{
        this.setState({openDialogs:false})
    }

    handleClearHistory = () => {
        this.handleMenuClose();

        clearHistory(AppStore.getChatId());
    };

    handleDeleteChat = () => {
        this.handleMenuClose();

        leaveChat(AppStore.getChatId());
    };

    handleUnpin = () => {
        this.handleMenuClose();

        const chatId = AppStore.getChatId();

        const media = MessageStore.getMedia(chatId);
        if (!media) return false;

        const { pinned } = media;
        if (!pinned) return false;
        if (pinned.length !== 1) return false;

        requestUnpinMessage(chatId, pinned[0].id);
    };

    handleSwitchBlocked = () => {
        this.handleMenuClose();

        const chatId = AppStore.getChatId();
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        const sender = getChatSender(chatId);
        const { is_blocked } = chat;
        if (is_blocked) {
            unblockSender(sender);
        } else {
            requestBlockSender(sender);
        }

    };

    //打开权限管理弹窗。 必须加上 handleMenuClose 不然会报错，很严重的错！
    onOpenDialog = ()=>{ 
        this.handleMenuClose();
        this.setState({ permissionsDialog: true });
    }
    //关闭权限管理弹窗
    onCloseDialog = ()=>{
        this.setState({ permissionsDialog: false });
    } 
  
    //获取服务器上的 权限管理， 禁止私聊等功能。。
    getBannedRightex = () =>{   
        const getChatId = AppStore.getChatId();
        let that = this;
        //let chatId = 1073742002;   
        const chatId1 = getChatId;  
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
                    if(newResult.data){ 
                        that.setState({permissions: newResult.data})   
                    }  
                } 
            })
            .catch(err => {  
                console.log("err on get permissions");
        });  
    } 
  
    //当switch的checked发生变化时调用的函数。
    handleChangeBanWhisper = (event) => { 
        let checked = event.target.checked;  
        this.UpdateNewPermission('banWhisper',checked);  
    };

    handleChangeBanSendWebLink = (event) => { 
        let checked = event.target.checked; 
        this.UpdateNewPermission('banSendWebLink',checked);  
    };

    handleChangeBanSendQRcode = (event) => { 
        let checked = event.target.checked; 
        this.UpdateNewPermission('banSendQRcode',checked);  
    }; 
    
    handleChangeBanSendKeyword = (event) => { 
        let checked = event.target.checked; 
        this.UpdateNewPermission('banSendKeyword',checked);  
    };

    handleChangeBanSendDmMention = (event) => { 
        let checked = event.target.checked; 
        this.UpdateNewPermission('banSendDmMention',checked);  
    };   

    handleChangeKickWhoSendKeyword = (event) => { 
        let checked = event.target.checked; 
        this.UpdateNewPermission('banSendKeyword',checked);  
    };

    handleChangeShowKickMessage = (event) => { 
        let checked = event.target.checked; 
        this.UpdateNewPermission('ShowKickMessage',checked);  
    };  

   
    //向服务器提桥更新权限请求。
    UpdateNewPermission = (type,open) =>{
        const {permissions} = this.state;
        open = open;
        switch(type){
            case 'banWhisper':
                permissions.banWhisper = open;
                break;
            case 'banSendWebLink':
                permissions.banSendWebLink = open;
                break; 
            case 'banSendQRcode':
                permissions.banSendQRcode = open;
                break;
            case 'banSendKeyword':
                permissions.banSendKeyword = open;
                break; 
            case 'banSendDmMention':
                permissions.banSendDmMention = open;
                break; 
            case 'kickWhoSendKeyword':
                permissions.kickWhoSendKeyword = open;
                break; 
            case 'ShowKickMessage':
                permissions.showKickMessage = open;
                break;
            // case 'banSendKeyword':
            //     permissions.banSendKeyword = open;
            //     break; 
            // case 'banSendKeyword':
            //     permissions.banSendKeyword = open;
            //     break;
            default:
                break;
        } 
        const chatId1 = AppStore.getChatId();
        let isSuper = false;
        if(chatId1 > 0){ 
            isSuper = true;
        }
        let chatId = Math.abs(chatId1);
        chatId = chatId.toString(); 
        chatId = chatId.slice(3); 
        chatId = parseInt(chatId); 
        TdLibController.send({
            '@type': 'sendCustomRequest',
            "method": "chats.modifyBannedRightex", 
            "parameters":JSON.stringify({
                "chatId": chatId,
                "isChannel":isSuper,
                banSendDmMention: permissions.banSendDmMention,
                banSendKeyword: permissions.banSendKeyword,
                banSendQRcode: permissions.banSendQRcode,
                banSendWebLink: permissions.banSendWebLink,
                banWhisper: permissions.banWhisper,
                kickWhoSendKeyword: permissions.kickWhoSendKeyword,
                showKickMessage: permissions.showKickMessage, 
            })
           
            
            })
            .then(data => {  
            })
            .catch(err => {   
                console.log("err on update permissions");
        });  
    }

    componentDidMount() {  
        this.getBannedRightex();
        TdLibController.on('update', this.onReceiveUpdateNewPermission);  
        
    }

    componentWillUnmount() {  
        TdLibController.off('update', this.onReceiveUpdateNewPermission); 
    } 
    //从服务器端接收  权限更新的推送。
    onReceiveUpdateNewPermission = update => {   
        switch (update['@type']) {
         case'updateNewCustomEvent': {   
             let event =JSON.parse(update.event); 
             if(event.action === "chats.rights.onUpdate"){
                let permissions = event.data;
                let newPermissions = {}; 
                if(permissions){ 
                    newPermissions.banSendDmMention = permissions.banSendDmMention;
                    newPermissions.banSendKeyword = permissions.banSendKeyword;
                    newPermissions.banSendQRcode = permissions.banSendQRcode;
                    newPermissions.banSendWebLink = permissions.banSendWebLink;
                    newPermissions.banWhisper = permissions.banWhisper;
                    newPermissions.kickWhoSendKeyword = permissions.kickWhoSendKeyword;
                    newPermissions.showKickMessage = permissions.showKickMessage;
                    this.setState({permissions:newPermissions});
                }
               
             } 
         }
         default:
             break;
         }
     }

    render() {
        
 
        const { t } = this.props;
        const { anchorEl,permissionsDialog,checkedPublic,permissions } = this.state; 
        const chatId = AppStore.getChatId();
        const chat = ChatStore.get(chatId);
        if (!chat) return null;

        const { is_blocked } = chat;

        const clearHistory = canClearHistory(chatId);
        const deleteChat = canDeleteChat(chatId);
        const deleteChatTitle = getDeleteChatTitle(chatId, t);
        const unpinMessage = hasOnePinnedMessage(chatId);
        const switchBlocked = canSwitchBlocked(chatId); 
        return (
            <>
            <Dialog
                    manager={modalManager}
                    transitionDuration={0}
                    open={permissionsDialog}
                    onClose={this.onCloseDialog}
                    aria-labelledby='fatal-error-dialog-title'
                    aria-describedby='fatal-error-dialog-description'>
                    <DialogTitle id='fatal-error-dialog-title'>权限管理</DialogTitle>
                    <DialogContent>
                        <div className="left_right_align"> 
                            <div className="allCenter mgr_30">
                                设置为公开群
                            </div>    
                            <Switch/>
                        </div>
                        <div className="left_right_align"> 
                            <div className="allCenter mgr_30">
                                群成员禁言
                            </div>    
                            <Switch  />
                        </div>
                        <div className="left_right_align mgb_4"> 
                            <div className="allCenter mgr_30">
                                被禁言成员列表
                            </div>    
                            <div>
                                <Button color="secondary">&gt;</Button>
                            </div>
                        </div>
                        <Divider />
                        <div className="left_right_align"> 
                            <div className="allCenter mgr_30">
                                禁止发送媒体
                            </div>
                            <Switch defaultChecked = {false}/>
                        </div>
                        <div className="left_right_align"> 
                            <div className="allCenter mgr_30">
                                禁止发送链接
                            </div>    
                            <Switch key={permissions.banSendWebLink} defaultChecked={permissions.banSendWebLink} onChange={this.handleChangeBanSendWebLink} />
                        </div>
                        <div className="left_right_align"> 
                            <div className="allCenter mgr_30">
                                禁止发送二维码
                            </div>    
                            <Switch  key={permissions.banSendQRcode} defaultChecked={permissions.banSendQRcode} onChange={this.handleChangeBanSendQRcode}/>
                        </div>
                        <div className="left_right_align"> 
                            <div className="allCenter mgr_30">
                                禁止发送DM消息
                            </div> 
                            <Switch  key={permissions.banSendDmMention} defaultChecked={permissions.banSendDmMention} onChange={this.handleChangeBanSendDmMention}/>
                        </div>
                        {/* <div className="left_right_align"> 
                            <div className="allCenter mgr_30">
                                禁止发送关键字
                            </div> 
                            <Switch  key={permissions.banSendKeyword} defaultChecked={permissions.banSendKeyword} onChange={this.handleChangeBanSendKeyword}/>
                        </div> */}
                        <div className="left_right_align mgb_4" > 
                            <div className="allCenter mgr_30">
                                屏蔽敏感词管理
                            </div>    
                            <div>
                                <Button color="secondary">&gt;</Button>
                            </div>
                        </div>
                        <div className="left_right_align"> 
                            <div className="allCenter mgr_30">
                                发送敏感词移除群聊
                            </div>    
                            <Switch  key={permissions.kickWhoSendKeyword} defaultChecked={permissions.kickWhoSendKeyword} onChange={this.handleChangeKickWhoSendKeyword}/>
                        </div>
                        <div className="left_right_align"> 
                            <div className="allCenter mgr_30">
                                敏感词移除群聊提示
                            </div>   
                            <Switch  key={permissions.showKickMessage} defaultChecked={permissions.showKickMessage} onChange={this.handleChangeShowKickMessage}/>
                        </div> 
                        <Divider />
                        <div className="left_right_align"> 
                            <div className="allCenter mgr_30">
                                群成员可邀请好友进群
                            </div>    
                            <Switch  />
                        </div> 
                        <div className="left_right_align"> 
                            <div className="allCenter mgr_30">
                                禁止加好友、私聊
                            </div>    
                            <Switch key={permissions.banWhisper} defaultChecked={permissions.banWhisper} onChange={this.handleChangeBanWhisper}/>
                        </div> 
                    </DialogContent>  
                    <DialogActions> 
                        <Button onClick={this.onCloseDialog} color='primary' autoFocus>
                            关闭
                        </Button>
                    </DialogActions>
                </Dialog>
            <Dialog
                open={this.state.openDialogs}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                PaperProps={{
                style: {
                    backgroundColor: "#fff",
                },
                }}
                >

                <DialogTitle id="alert-dialog-title">
                    "Use Google's location service?"
                </DialogTitle>

                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Hello 
                    </DialogContentText>
                </DialogContent>

                <DialogActions>
                    <Button onClick={this.handleManageGroupClose} color="primary">
                            OK
                    </Button>
                </DialogActions>
            </Dialog>
                <IconButton
                    aria-owns={anchorEl ? 'simple-menu' : null}
                    aria-haspopup='true'
                    className='main-menu-button'
                    aria-label='Menu'
                    onClick={this.handleButtonClick}>
                    <MoreVertIcon />
                </IconButton>
                <Menu
                    id='main-menu'
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={this.handleMenuClose}
                    getContentAnchorEl={null}
                    disableAutoFocusItem
                    disableRestoreFocus={true}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right'
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right'
                    }}>
                    <MenuItem onClick={this.handleChatInfo}>
                        <ListItemIcon>
                            {isPrivateChat(chatId) ? <UserIcon /> : <GroupIcon />}
                        </ListItemIcon>
                        <ListItemText primary={getViewInfoTitle(chatId, t)} />
                    </MenuItem>
                    {/* TODO   管理群组 */}
                    <MenuItem onClick={this.onOpenDialog}>
                        <ListItemIcon>
                            {isPrivateChat(chatId) ? <UserIcon /> : <GroupIcon />}
                        </ListItemIcon>
                        <ListItemText primary={t('ManageGroup')} />
                    </MenuItem>

                    {clearHistory && (
                        <MenuItem onClick={this.handleClearHistory}>
                            <ListItemIcon>
                                <BroomIcon />
                            </ListItemIcon>
                            <ListItemText primary={t('ClearHistory')} />
                        </MenuItem>
                    )}
                    {deleteChat && deleteChatTitle && (
                        <MenuItem onClick={this.handleDeleteChat}>
                            <ListItemIcon>
                                <DeleteIcon />
                            </ListItemIcon>
                            <ListItemText primary={deleteChatTitle} />
                        </MenuItem>
                    )}
                    {unpinMessage && (
                        <MenuItem onClick={this.handleUnpin}>
                            <ListItemIcon>
                                <UnpinIcon />
                            </ListItemIcon>
                            <ListItemText primary={t('UnpinMessageAlertTitle')} />
                        </MenuItem>
                    )}
                    {switchBlocked && (
                        <MenuItem onClick={this.handleSwitchBlocked}>
                            <ListItemIcon>
                                {is_blocked ? <AddMemberIcon /> : <RemoveMemberIcon />}
                            </ListItemIcon>
                            <ListItemText primary={is_blocked ? t('Unblock') : t('BlockContact')} />
                        </MenuItem>
                    )}
                </Menu>
            </>
        );
    }
}

export default withTranslation()(MainMenuButton);
