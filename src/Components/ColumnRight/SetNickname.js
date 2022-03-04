/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { withTranslation } from 'react-i18next';
import Checkbox from '@material-ui/core/Checkbox';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';
import Notifications from '../ColumnMiddle/Notifications';
import './SetNickname.css';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import { modalManager } from '../../Utils/Modal'; 
class SetNickname extends Notifications {
    constructor(props) {
        super(props); 
        this.state = { 
            nicknameDialog:false,
            nikename:"",
        };
    }

    onOpenNicknameDialog = ()=>{ 
        this.setState({nicknameDialog:true});
    }
  
    onCloseNicknameDialog = ()=>{
        this.setState({nicknameDialog:false});
    } 

    onChangeNickname = (event) => { 
        this.setState({nikename:event.target.value});
    }

    onSaveNickname = (enent) =>{
        let {nikename} = this.state;
    }
    render() { 
        const { nicknameDialog,nikename } = this.state; 
        return (
            <>
                <ListItem className='list-item-rounded' alignItems='flex-start' onClick={this.handleOpenChat}>

                    <div style={{ paddingLeft: 40, width: '100%' }} className="left_right_align">
                        <div className='allCenter'>
                            我在本群的昵称
                        </div>
                        <Button onClick={this.onOpenNicknameDialog} color="secondary">&gt;</Button>
                    </div>
                </ListItem>

                <Dialog
                    manager={modalManager}
                    transitionDuration={0}
                    open={nicknameDialog}
                    onClose={this.onCloseNicknameDialog}
                    aria-labelledby='fatal-error-dialog-title'
                    aria-describedby='fatal-error-dialog-description'>
                    <DialogTitle id='fatal-error-dialog-title'>设置屏蔽敏感词</DialogTitle>
                    <DialogContent>
                        <TextField
                            helperText="多个词之间用逗号分开"
                            rows={4}
                            defaultValue={nikename}
                            multiline
                            onChange={this.onChangeNickname}
                            variant="outlined" />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.onSaveNickname} color='primary' autoFocus>
                            保存
                        </Button>
                        <Button onClick={this.onCloseNicknameDialog} color='primary'>
                            关闭
                        </Button>
                    </DialogActions>
                </Dialog>
            </> 
        );
    }
}

export default withTranslation()(SetNickname);
