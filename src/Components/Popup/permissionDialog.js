/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { withTranslation } from 'react-i18next'; 
import AppStore from '../../Stores/ApplicationStore';
import ChatStore from '../../Stores/ChatStore';  
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent'; 
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import { modalManager } from '../../Utils/Modal'; 
import Switch from '@material-ui/core/Switch';
import Divider from '@material-ui/core/Divider';
import PropTypes from 'prop-types';

class permissionsDialog extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          openDialogs: false,
          permissionsDialog:false,
          checkedPublic:false, 
          defaultPublic:false
        }; 
    }   

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const {onCancel, open } = this.props;   
        if (nextProps.onCancel !== onCancel) {
            return true;
        }

        if (nextProps.open !== open) {
            return true;
        }

        return false;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { defaultText, defaultUrl, open } = this.props; 
    }
 
     handleChangePublic = (event) => {
        // let checked = event.target.checked;
        // const chatId = AppStore.getChatId();
        // TdLibController.send({
        //     '@type': 'toggleChannelPublic',
        //     supergroup_id: chatId, 
        //     is_public:checked
        // }).then(result =>{
        //    debugger
        // }).finally(data => {
        //     debugger
        // }).catch(e => {
        //      debugger
        // }); 
      };
  

    render() {
        const { open} = this.props;  
        if (!open) return null;
       
        return (
            <>
            <Dialog
                    manager={modalManager}
                    transitionDuration={0}
                    open={true}
                    onClose={this.onCloseDialog}
                    aria-labelledby='fatal-error-dialog-title'
                    aria-describedby='fatal-error-dialog-description'>
                    <DialogTitle id='fatal-error-dialog-title'>????????????</DialogTitle>
                    <DialogContent>
                        <div class="left_right_align"> 
                            <div class="allCenter mgr_30">
                                ??????????????????
                            </div>    
                            <Switch />
                        </div>
                        <div class="left_right_align"> 
                            <div class="allCenter mgr_30">
                                ???????????????
                            </div>    
                            <Switch  />
                        </div>
                        <div class="left_right_align mgb_4"> 
                            <div class="allCenter mgr_30">
                                ?????????????????????
                            </div>    
                            <div>
                                <Button color="secondary">&gt;</Button>
                            </div>
                        </div>
                        <Divider />
                        <div class="left_right_align"> 
                            <div class="allCenter mgr_30">
                                ??????????????????
                            </div>
                            <Switch  />
                        </div>
                        <div class="left_right_align"> 
                            <div class="allCenter mgr_30">
                                ??????????????????
                            </div>    
                            <Switch  />
                        </div>
                        <div class="left_right_align"> 
                            <div class="allCenter mgr_30">
                                ?????????????????????
                            </div>    
                            <Switch  />
                        </div>
                        <div class="left_right_align"> 
                            <div class="allCenter mgr_30">
                                ????????????DM??????
                            </div>    
                            <Switch  />
                        </div>
                        <div class="left_right_align mgb_4" > 
                            <div class="allCenter mgr_30">
                                ?????????????????????
                            </div>    
                            <div>
                                <Button color="secondary">&gt;</Button>
                            </div>
                        </div>
                        <div class="left_right_align"> 
                            <div class="allCenter mgr_30">
                                ???????????????????????????
                            </div>    
                            <Switch  />
                        </div>
                        <div class="left_right_align"> 
                            <div class="allCenter mgr_30">
                                ???????????????????????????
                            </div>    
                            <Switch  />
                        </div> 
                        <Divider />
                        <div class="left_right_align"> 
                            <div class="allCenter mgr_30">
                                ??????????????????????????????
                            </div>    
                            <Switch  />
                        </div> 
                        <div class="left_right_align"> 
                            <div class="allCenter mgr_30">
                                ????????????????????????
                            </div>    
                            <Switch  />
                        </div> 
                    </DialogContent>  
                    <DialogActions> 
                        <Button onClick={this.onCloseDialog} color='primary' autoFocus>
                            ??????
                        </Button>
                    </DialogActions>
                </Dialog>
          
              
            </>
        );
    }
}
permissionsDialog.propTypes = {
    open: PropTypes.bool, 
    onCancel: PropTypes.func.isRequired
};
export default withTranslation()(permissionsDialog);
