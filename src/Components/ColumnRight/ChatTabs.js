/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';   
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box'; 
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
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import { modalManager } from '../../Utils/Modal'; 
import Switch from '@material-ui/core/Switch';
import Divider from '@material-ui/core/Divider'; 
import TextField from '@material-ui/core/TextField'; 
import Snackbar from '@material-ui/core/Snackbar';
import { isAdmin,getGroupChatMembers,getSupergroupId } from '../../Utils/Chat'; 
function TabPanel(props) {
    const { children, value, index, ...other } = props;
  
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ p: 3 }}>
            <Typography>{children}</Typography>
          </Box>
        )}
      </div>
    );
  }
  
  TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
  };
  
  function a11yProps(index) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }
  

class ChatTabs extends React.Component {
    state = {
        value: 0,
        filterKeywordDialog:false,
          filterKeyword:[],
          defaultKeyword:'',
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
          chatPermissions:{  
            can_add_web_page_previews: false,
            can_change_info: false,
            can_invite_users: false,
            can_pin_messages: false,
            can_send_media_messages: false,
            can_send_messages: false,
            can_send_other_messages: false,
            can_send_polls: false,
          },
          chatPublic:false,
          vertical:'top',
          horizontal:'center', 
          openToast:false
    };

    handleOpenToast = () =>{
      this.setState({openToast:true}); 
    }
    handleCloseToast = () =>{
      this.setState({openToast:false});
    }
    handleChange = (event, value) => {
        this.setState({ value });
    };

    //进入页面时，接收到chatid，并获取相关数据。。。
    componentWillReceiveProps (nextProps){
      this.getBannedRightex();
      this.getChatPermissions(); 
      this.getChatPublic();
      const chatId = AppStore.getChatId();
      let getAdmin = isAdmin(chatId);
      this.setState({admin:getAdmin}); 
      this.onGetMuteMembers();
      this.onGetGroupUsers();
    }

    onGetGroupUsers = ()=>{ 
      return;
        const chatId = AppStore.getChatId();
        const supergroupId = getSupergroupId(chatId);
       
        let chatId1 = this.fixChatId(chatId); 
        TdLibController.send({
            '@type': 'getSupergroupMembers',
            supergroup_id: chatId1,
            filter: { '@type': 'supergroupMembersFilterRecent' },
            offset: 0,
            limit: 200
        }) .then(data => {  
      })
      .catch(err => {   
          console.log("err on get permissions");
      }); 
    }

     //打开权限管理弹窗。 必须加上 handleMenuClose 不然会报错，很严重的错！
    onOpenDialog = ()=>{ 
      this.handleMenuClose();
        this.setState({ permissionsDialog: true });
    }
    //关闭权限管理弹窗
    onCloseDialog = ()=>{
        this.setState({ permissionsDialog: false });
    } 

    //获取服务器上的 禁止群聊/禁止发媒体文件/是否能邀请好友等功能
    getChatPermissions = () =>{ 
        const chatId = AppStore.getChatId();
        TdLibController.send({
            '@type': 'getChat',
            "chat_id": chatId, 
            })
            .then(data => { 
                
                if(data){
                    if(data.permissions){  
                        setTimeout(() => {
                            this.setState({chatPermissions:data.permissions});  
                        }, 50);
                    }
                }
              
            })
            .catch(err => {   
                console.log("err on get permissions");
        });   
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

    getChatPublic = () => {
      const chatId = AppStore.getChatId();
      const supergroupId = getSupergroupId(chatId);  
      TdLibController.send({ 
        "@type": "getSupergroup", 
        "supergroup_id":  supergroupId, 
      }).then(result =>{    
        if(result.username != ""){
          this.setState({chatPublic:true});
        }else{
          this.setState({chatPublic:false});
        } 
        console.log("suc on get chatPublic");
      }).catch(e => {   
          console.log("err on get chatPublic");
      }); 
    }

    handleChangeChatPublic = (event) =>{
      let checked = event.target.checked;   
      const chatId = AppStore.getChatId();
      const supergroupId = getSupergroupId(chatId);  
      TdLibController.send({ 
          "@type": "toggleChannelPublic", 
          "supergroup_id":   supergroupId,
          "is_public": checked, 
      }).then(result =>{   
          console.log("ok on update permissions");
      }).finally(() => {
          
      }).catch(e => {   
          console.log("err on update permissions");
      }); 
    }

    //当switch的checked发生变化时调用的函数。 禁止私聊switch 发生变化
    handleChangeBanWhisper = (event) => { 
        let checked = event.target.checked;  
        this.UpdateNewPermission('banWhisper',checked);  
    };
    //禁止发送网页链接 switch 发生变化
    handleChangeBanSendWebLink = (event) => { 
        let checked = event.target.checked; 
        this.UpdateNewPermission('banSendWebLink',checked);  
    };
    //禁止发送二维码switch 发生变化
    handleChangeBanSendQRcode = (event) => { 
        let checked = event.target.checked; 
        this.UpdateNewPermission('banSendQRcode',checked);  
    }; 
    //禁止发送关键字switch 发生变化
    handleChangeBanSendKeyword = (event) => { 
        let checked = event.target.checked; 
        this.UpdateNewPermission('banSendKeyword',checked);  
    };
    //禁止发送dm@switch 发生变化
    handleChangeBanSendDmMention = (event) => { 
        let checked = event.target.checked; 
        this.UpdateNewPermission('banSendDmMention',checked);  
    };   
    //发送敏感词移出群聊switch 发生变化
    handleChangeKickWhoSendKeyword = (event) => { 
        let checked = event.target.checked; 
        this.UpdateNewPermission('kickWhoSendKeyword',checked);  
    };
    //禁止发送消息switch 发生变化
    handleChangeShowKickMessage = (event) => { 
        let checked = event.target.checked; 
        this.UpdateNewPermission('ShowKickMessage',checked);  
    };  
    //禁止发送媒体文件switch 发生变化
    handleChangeCanSendMedia = (event) => { 
        let checked = event.target.checked; 
        this.onUpdateChatPermissions('canSendMedia',checked);  
    };  
    //禁止发送信息switch 发生变化
    handleChangeCanSendMessage= (event) => { 
        let checked = event.target.checked; 
        this.onUpdateChatPermissions('canSendMessage',checked);  
    };  
    handleChangeCanInviteUsers = (event) => { 
        let checked = event.target.checked; 
        this.onUpdateChatPermissions('canInviteUsers',checked);  
    };  

    //修改权限----是否禁言/是否能发送媒体/是否能邀请好友。
    onUpdateChatPermissions = (type,open) => {
        
        const {chatPermissions} = this.state;
        switch(type){
            case 'canSendMessage': 
                chatPermissions.can_send_messages = !open; 
                break;
            case 'canSendMedia':
                chatPermissions.can_send_media_messages = !open;
                break;
            case 'canInviteUsers':
                chatPermissions.can_invite_users = open;
                break;
        } 
        const chatId1 = AppStore.getChatId(); 
        TdLibController.send({ 
            "@type": "setChatPermissions",
            "chat_id": chatId1,
            "permissions": {
                "@type": "chatPermissions",
                "can_send_messages": chatPermissions.can_send_messages ,
                "can_send_media_messages": chatPermissions.can_send_media_messages ,
                "can_invite_users":chatPermissions.can_invite_users
        }
        }).then(result =>{  
            console.log("ok on update permissions");
        }).finally(() => {
            
        }).catch(e => {  
            console.log("err on update permissions");
        }); 
    };

    //修改权限---modifyBannedRightex里的相关权限。
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
            default:
                break;
        } 
        const chatId1 = AppStore.getChatId();
        let isSuper = false;
        if(chatId1 > 0){ 
            isSuper = true;
        }
        let chatId = this.fixChatId(chatId1);
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

    //获取chatid      自定义的函数需要将chatid 去掉 负数
    fixChatId = (chatId1) =>{
        let chatId = Math.abs(chatId1);
        chatId = chatId.toString(); 
        chatId = chatId.slice(3); 
        chatId = parseInt(chatId); 
        return chatId;
    }

    componentDidMount() {   
      TdLibController.on('update', this.onReceiveUpdateNewPermission);   
    }

    componentWillUnmount() {  
        TdLibController.off('update', this.onReceiveUpdateNewPermission); 
    } 
    //从服务器端接收  权限更新的推送。
    onReceiveUpdateNewPermission = update => {   
        switch (update['@type']) {
            //监听聊天室的权限推送
            case 'updateChatPermissions':
                let per = update.permissions;  
                let newPermissions = {};
                newPermissions.can_send_media_messages = per.can_send_media_messages;
                newPermissions.can_send_messages = per.can_send_messages;
                newPermissions.can_invite_users = per.can_invite_users; 
                this.setState({chatPermissions:per});
                break;
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
                //监听敏感词发生变化时的推送
                else if(event.action === "chats.keywords.onUpdate"){
                    let keywords = event.data.keywords;
                    this.setState({filterKeyword:keywords}) 
                }
            }
            default:
                break;
            }
    }
    //打开敏感词对话框 并获取敏感词
    filterKeyword = () =>{
        this.setState({filterKeywordDialog:true});
        const chatId1 = AppStore.getChatId(); 
        let chatId = this.fixChatId(chatId1); 

        TdLibController.send({
            '@type': 'sendCustomRequest',
            "method": "chats.getFilterKeywords",
            "parameters":JSON.stringify({"chatId": chatId})
            })
            .then(data => { 
                let result = JSON.parse(data.result);
                let keyword = result.data;
                this.setState({filterKeyword:keyword});  
            })
            .catch(err => {   
                console.log("err on get permissions");
        });  
    }
    //关闭敏感词输入框   对话框
    onClosefilterKeywordDialog = () =>{
        this.setState({filterKeywordDialog:false});
    }
    //敏感词文本框的值发生变化时。
    onChangeTextfiledValue = (event) => { 
        this.setState({filterKeyword:event.target.value});
    }

    //保存敏感词
    onSavefilterKeyword = () =>{
        let {filterKeyword} = this.state;
        const chatId1 = AppStore.getChatId(); 
        let chatId = this.fixChatId(chatId1);  
        let keywordArr=null; 
        if(!Array.isArray(filterKeyword)){
          keywordArr = filterKeyword.split(","); 
        } else{
          keywordArr = filterKeyword;
        }
        if(keywordArr[keywordArr.length-1] === ""){
            keywordArr.pop();
        } 
        TdLibController.send({
            '@type': 'sendCustomRequest',
            "method": "chats.setFilterKeywords", 
            "parameters":JSON.stringify({
                "chatId": chatId,
                "keywords":keywordArr, 
            })  
            })
            .then(data => {   
              this.handleOpenToast('保存成功');
              this.onClosefilterKeywordDialog();
            })
            .catch(err => {   
                this.onClosefilterKeywordDialog(); 
                this.handleOpenToast('保存失败，请稍后重试'); 
                console.log("err on update SavefilterKeyword");
        });  
    }

    onGetMuteMembers = () =>{  
      return;
      const chatId1 = AppStore.getChatId(); 
        let chatId = this.fixChatId(chatId1);  
      TdLibController.send({
                        '@type': 'getSupergroupMembers',
                        "supergroup_id": chatId, 
                        "offset":0,
                        "limit":200,
                        // "@extra":72,
                        "filter": {
                            "@type": "supergroupMembersFilterRestricted",
                            },
                        })
                        .then(data => { 
                             debugger
                        })
                        .catch(err => {   
                            debugger
                            console.log("err on get permissions");
                    });   

        // ({"filter":{"@type":"supergroupMembersFilterRestricted"}
        // ,"offset":0
        // ,"@type":"getSupergroupMembers"
        // ,"limit":200
        // ,"supergroup_id":1073741825
        // ,"@extra":72})
      
        // const result = TdLibController.send({
        //     '@type': 'getUserFullInfo',
        //     user_id: UserStore.get(UserStore.getMyId())
        // })
        // .then(data => { 
        //     debugger
        // })
        // .catch(err => {   
        //    debugger
        //    console.log("err on get permissions");
        // });   
        
        // TdLibController.send({
        //     '@type': 'getChat',
        //     "chat_id": chatId, 
        //     })
        //     .then(data => {  
        //         if(data){
        //             let chatId1 = this.fixChatId(chatId);  
        //             TdLibController.send({
        //                 '@type': 'getSupergroupMembers',
        //                 "supergroup_id": chatId1, 
        //                 "offset":0,
        //                 "limit":200,
        //                 // "@extra":72,
        //                 "filter": {
        //                     "@type": "supergroupMembersFilterRestricted",
        //                     },
        //                 })
        //                 .then(data => { 
        //                      debugger
        //                 })
        //                 .catch(err => {   
        //                     debugger
        //                     console.log("err on get permissions");
        //             });   
        //         }
              
        //     })
        //     .catch(err => {   
        //         console.log("err on get permissions");
        // });   
      
    }

    render() {
        const {  chatId } = this.props;
        const { 
          value,permissions ,
          chatPermissions,
          admin,
          filterKeyword,
          filterKeywordDialog,
          chatPublic,
          vertical, horizontal, openToast
        }
        = this.state; 
        return (
            <> 
                <Tabs
                    value={value}
                    onChange={this.handleChange}
                    indicatorColor='primary'
                    textColor='primary'
                    scrollable
                    scrollButtons='off'
                    fullWidth>
                    <Tab label='成员列表' style={{ minWidth: '40px' }} />
                    <Tab label='权限管理' style={{ minWidth: '40px' }} /> 
                </Tabs>
                <TabPanel value={value} index={0}>
                        成员列表
                </TabPanel>
                <TabPanel value={value} index={1}>
                  <div style={{padding:'15px'}}>
                    <div className="left_right_align"> 
                      <div className="allCenter mgr_30">
                        设置为公开群
                      </div>    
                      <Switch  key={chatPublic} defaultChecked={chatPublic} onChange={this.handleChangeChatPublic} handleChangeChatPublic/>
                    </div>
                    <div className="left_right_align"> 
                        <div className="allCenter mgr_30">
                          群成员禁言
                        </div>    
                      <Switch key={!chatPermissions.can_send_messages} defaultChecked={!chatPermissions.can_send_messages} onChange={this.handleChangeCanSendMessage} />
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
                      <Switch key={!chatPermissions.can_send_media_messages} defaultChecked={!chatPermissions.can_send_media_messages} onChange={this.handleChangeCanSendMedia}/>
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
                            <Button onClick={this.filterKeyword} color="secondary">&gt;</Button>
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
                      <Switch key={chatPermissions.can_invite_users} defaultChecked={chatPermissions.can_invite_users} onChange={this.handleChangeCanInviteUsers}  />
                    </div> 
                    <div className="left_right_align"> 
                        <div className="allCenter mgr_30">
                          禁止加好友、私聊
                        </div>    
                      <Switch key={permissions.banWhisper} defaultChecked={permissions.banWhisper} onChange={this.handleChangeBanWhisper}/>
                    </div> 
                  </div>
                </TabPanel> 
                <Dialog
                    manager={modalManager}
                    transitionDuration={0}
                    open={filterKeywordDialog}
                    onClose={this.onClosefilterKeywordDialog}
                    aria-labelledby='fatal-error-dialog-title'
                    aria-describedby='fatal-error-dialog-description'>
                    <DialogTitle id='fatal-error-dialog-title'>设置屏蔽敏感词</DialogTitle>
                    <DialogContent> 
                        <TextField 
                            helperText="多个词之间用逗号分开"   
                            rows={4}
                            defaultValue={filterKeyword}
                            multiline 
                            onChange={this.onChangeTextfiledValue}
                            variant="outlined" />
                    </DialogContent>  
                    <DialogActions> 
                        <Button onClick={this.onSavefilterKeyword} color='primary' autoFocus>
                            保存
                        </Button>
                        <Button onClick={this.onClosefilterKeywordDialog} color='primary'>
                            关闭
                        </Button>
                    </DialogActions>
                </Dialog>

                <Snackbar
                  anchorOrigin={{ vertical, horizontal }}
                  open={openToast}
                  onClose={this.handleCloseToast}
                  message="I love snacks"
                  key={vertical + horizontal}
                />
            </>
        ); 
    }
}

ChatTabs.propTypes = {
    chatId: PropTypes.number.isRequired,   
}; 

export default ChatTabs;
