NEJ.define([
  'base/klass',
  'base/util',
  'base/element',
  'base/event',
  'util/event/event',
  'util/tab/view',
  'util/template/tpl',
  'util/template/jst',
  'pro/common/jst_extend',
  'pro/common/module',
  'pro/common/util',
  'pro/cache/interface_cache',
  'pro/cache/iheader_cache',
  'pro/cache/parameter_cache',
  'pro/cache/datatype_cache',
  'pro/cache/group_cache',
  'pro/cache/pro_cache',
  'pro/cache/pg_cache',
  'pro/cache/user_cache',
  'pro/select2/select2',
  'pro/tagme/tagme',
  'pro/modal/modal_message',
  'text!./change_message.html',
  'pro/notify/notify',
  'json!3rd/fb-modules/config/db.json'
], function (_k, u, _e, _v, c, _t, _l, _j, jstExt, _m, _cu, _inCache, _iheaderCache, _paramCache, _dataTypeCache, _groupCache, _proCache, _pgCache, _usrCache, Select2, _tag, MessageModal, messageTpl, notify, dbConst, _p, _pro) {

  _p._$$ModuleResInterfaceDetail = _k._$klass();
  _pro = _p._$$ModuleResInterfaceDetail._$extend(_m._$$Module);

  // 记录接口原始数据用于对比
  var method;
  var path;
  var reqFormat;
  var resFormat;

  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-res-interface-detail')
    );

    this.__watchList = [];
    this.__tabhead = _e._$getByClassName(this.__body, 'tab-head')[0];
    this.__tabbody = _e._$getByClassName(this.__body, 'tab-body')[0];

    this.auditBtns = _e._$getByClassName(this.__body, 'tab-audit')[0];
    this.auditRejectBtn = _e._$getByClassName(this.__body, 'audit-reject')[0];
    this.auditAgreeBtn = _e._$getByClassName(this.__body, 'audit-agree')[0];
    this.auditSubmitBtn = _e._$getByClassName(this.__body, 'audit-submit')[0];

    this.__export = {
      tab: _e._$getByClassName(this.__body, 'tab-wrap')[0],
      parent: _e._$getByClassName(this.__body, 'tab-con-s')[0]
    };
    var user = _usrCache._$$CacheUser._$allocate();
    this._currentUserId = user._$getUserInCache().id; //当前登录用户ID

    //接口cache
    this.__inCache = _inCache._$$CacheInterface._$allocate({
      onitemload: function () {
        this.__interface = this.__inCache._$getItemInCache(this.__id);

        method = this.__interface.method;
        path = this.__interface.path || '空';
        reqFormat = this.__interface.reqFormat;
        resFormat = this.__interface.resFormat;

        //项目组cache
        this.__pgCache = _pgCache._$$CacheProGroup._$allocate({
          onitemload: function () {
            this.__progroup = this.__pgCache._$getItemInCache(this.__interface.progroupId);
            var privilege = this.__pgCache._$getPrivilege(this.__interface.progroupId);
            this.__interface.privilege = privilege;
            //根据身份获取权限字段，给予不同页面操作权限
            this._permit = true;

            if (privilege.isObserver) {
              this._permit = false;
            }

            this.__interface.permit = this._permit;
            _e._$addClassName(this.auditBtns, 'f-dn');
            // {
            //     isOthers: userRole === 'others',
            //     isObserver: userRole === 'observer',
            //     isTester: userRole === 'tester',
            //     isDev: userRole === 'developer',
            //     isCreator: userRole === 'creator',
            //     isAdmin: userRole === 'administrator',
            //     isAuditor: userRole === 'auditor',
            //     isInGroup: userRole !== 'others',
            //     isAdminOrCreator: /^(creator|administrator)$/.test(userRole)
            // }
            //审核通过按钮仅对有权限审核的人(API审核人员，API管理员)显示
            if ((privilege.isAuditor || privilege.isAdminOrCreator) && this.__interface.status.id == dbConst.STATUS_SYS_AUDITING) {
              _e._$delClassName(this.auditBtns, 'f-dn');
              _e._$addClassName(this.auditSubmitBtn, 'f-dn');
              _e._$delClassName(this.auditAgreeBtn, 'f-dn');
              _e._$delClassName(this.auditRejectBtn, 'f-dn');
            }

            //重新提交审核按钮仅对状态为 ‘审核失败’ 的接口详情页展示且当前用户有操作权限的时候显示
            if (privilege.isDev && this.__interface['creator']['id'] == this._currentUserId && this.__interface.status.id == dbConst.STATUS_SYS_AUDIT_FAILED) {
              _e._$delClassName(this.auditBtns, 'f-dn');
              _e._$addClassName(this.auditAgreeBtn, 'f-dn');
              _e._$addClassName(this.auditRejectBtn, 'f-dn');
              _e._$delClassName(this.auditSubmitBtn, 'f-dn');
            }

            //业务分组cache
            this.__groupCache = _groupCache._$$CacheGroup._$allocate({
              onlistload: function () {
                //此时获取到了页面所需所有数据，进行页面渲染
                this.__renderView();
              }.bind(this)
            });

            //发送业务分组请求
            this.__groupCache._$getList({
              key: this.__groupCache._$getListKey(this.__pid),
              data: {
                pid: this.__interface.projectId
              }
            });
          }._$bind(this)
        });

        //发送项目组详情请求，此时是从项目组树中取缓存
        this.__pgCache._$getItem({
          id: this.__interface.progroupId
        });

        // 缓存接口头信息，用于差异对比
        this.__headers = this.__getHeaders();

        // 缓存参数信息，用于差异对比
        this.__params = this.__getParams();
      }.bind(this),
      onitemupdate: function () {
        if (this.__watchList.length) {
          _e._$delClassName(this.__sendMessageBtn, 'disabled');
        } else {
          _e._$addClassName(this.__sendMessageBtn, 'disabled');
        }
      }.bind(this)
    });

    //项目cache
    this.__proCache = _proCache._$$CachePro._$allocate({
      onitemload: function () {
        this.__project = this.__proCache._$getItemInCache(this.__pid);
        this.__inCache._$getItem({
          id: this.__id
        });
      }.bind(this)
    });

    this.__iheaderCache = _iheaderCache._$$CacheIHeader._$allocate();
    this.__paramCache = _paramCache._$$CacheParameter._$allocate();

    this.__dataTypeCache = _dataTypeCache._$$CacheDatatype._$allocate({
      onlistload: function () {
        //发送请求
        this.__proCache._$getItem({
          id: this.__pid
        });
      }.bind(this)
    });
  };

  _pro.__onShow = function (_options) {
    this.__doInitDomEvent([
      [_inCache._$$CacheInterface, 'update', this.__interfaceUpdate.bind(this)],
      [_iheaderCache._$$CacheIHeader, 'update', this.__headersUpdate.bind(this)],
      [_iheaderCache._$$CacheIHeader, 'itemsadded', this.__headersUpdate.bind(this)],
      [_iheaderCache._$$CacheIHeader, 'itemsdeleted', this.__headersUpdate.bind(this)],
      [_paramCache._$$CacheParameter, 'update', this.__paramsUpdate.bind(this)],
      [_paramCache._$$CacheParameter, 'itemsadded', this.__paramsUpdate.bind(this)],
      [_paramCache._$$CacheParameter, 'itemsdeleted', this.__paramsUpdate.bind(this)],
      [
        _inCache._$$CacheInterface, 'itemsdeleted',
        function () {
          if (!this.__interface.versions || this.__interface.versions.length === 0) {
            var versionDiv = _e._$getByClassName(this.__body, 'item-version')[0];
            _e._$addClassName(versionDiv, 'f-dn');
          }
        }.bind(this),
      ],
      [
        _inCache._$$CacheInterface, 'versioncreated',
        function () {
          if (this.__interface.versions && this.__interface.versions.length > 0) {
            var versionDiv = _e._$getByClassName(this.__body, 'item-version')[0];
            var versionInput = _e._$getByClassName(versionDiv, 'version-name')[0];
            versionInput.value = this.__interface.version.name;
            _e._$delClassName(versionDiv, 'f-dn');
          }
        }.bind(this)
      ]
    ]);
    this.__initAuditBtns();

    this.__super(_options);
  };

  // 显示变更弹窗
  _pro.__showChangeDialog = function (content) {
    var _messageModal = new MessageModal({
      data: {
        title: '接口变更提醒',
        contentTemplate: messageTpl,
        message: content
      }
    });

    _messageModal.$on('ok', function (data) {
      this.__inCache._$sendApiChangeMessage({
        id: this.__interface.id,
        content: data.message,
        onload: function () {
          _messageModal.destroy();
        }
      });
    }._$bind(this));
  };

  _pro.__getSchema = function () {
    var curSchemaString = this.__progroup.httpSpec.interfaceSchema;
    try {
      var schema = JSON.parse(curSchemaString);
      var allSchemaKeys = Object.keys(schema);
      if (allSchemaKeys.indexOf(this.__interface.schema) > -1) {
        return this.__interface.schema;
      } else {
        return '';
      }
    } catch (e) {
      return '';
    }
  };

  /**
   * 渲染视图
   * @return {Void}
   */
  _pro.__renderView = function () {
    // 关闭加载中提示
    _e._$addClassName(this.__loading, 'f-dn');
    this.__pid = this.__interface.projectId;
    var schema = this.__getSchema();
    _j._$render(this.__tabhead, 'm-r-i-detail', Object.assign(this.__interface, {interfaceSchema: schema}));
    this.__watchBtn = _e._$getByClassName(this.__body, 'watch')[0];
    this.__cancleWatchBtn = _e._$getByClassName(this.__body, 'cancle-watch')[0];
    _e._$delClassName(this.__tabbody, 'f-dn');
    // 标签组件
    this.__watchList = this.__interface.watchList || [];
    //如果是创建者直接示例化多选关注人标签，非创建者直接渲染关注人区域
    if (this.__interface.privilege.isAdminOrCreator || this.__interface.creator.id == this._currentUserId || this.__interface.respo.id == this._currentUserId) {
      _e._$addClassName(this.__watchBtn, 'fn');
      _e._$addClassName(this.__cancleWatchBtn, 'fn');
      this.__initFollowTag();
    } else {
      this.__initWatch();
    }

    this.__initMessageBox();
    this.__initTag();
    //显示创建者
    var creatorDiv = _e._$getByClassName(this.__body, 'creator-container')[0];
    creatorDiv.innerHTML = jstExt.escape2(this.__interface.creator.realname);
    //选择器实例化
    this._initSelectRespo();
    this._initSelectStatus(this.__interface.status);
    // 在公共资源库中不显示分组选项
    var group = _e._$getByClassName(this.__body, 'group')[0];
    if (!this.__interface.version || this.__interface.version.name == null) {
      var node = _e._$getByClassName(this.__body, 'item-version')[0];
      _e._$addClassName(node, 'f-dn');
    }
    if (this.__project.type === 1) {
      _e._$addClassName(group, 'f-dn');
    } else {
      _e._$delClassName(group, 'f-dn');
      this._initSelectGroup();
    }
  };

  _pro.__onRefresh = function (_options) {
    this.__super(_options);
    // 显示加载中提示
    this.__loading = _e._$getByClassName(document, 'u-loading')[0];
    _e._$delClassName(this.__loading, 'f-dn');
    this.__id = _options.param.id.replace('/', '');
    this.__pid = _options.param.pid.replace('/', '');

    this.__dataTypeListCacheKey = this.__dataTypeCache._$getListKey(this.__pid);
    this.__dataTypeCache._$getList({
      key: this.__dataTypeListCacheKey,
      data: {
        pid: this.__pid
      }
    });
  };

  /**
   * 检查接口创建时间是否晚于规范创建时间
   * @return {Boolean} true 表示接口创建时间晚于规范创建时间，限制修改 false则反之
   */
  _pro.__checkCreateTime = function () {
    return !this.__progroup.httpSpec.createTime || this.__interface.createTime >= this.__progroup.httpSpec.createTime;
  };

  /**
   * 检查某项输入是否符合
   * @return {Boolean}
   */
  _pro.__checkValidity = function (value, regexStr) {
    if (regexStr == null || regexStr === '') {
      return true;
    } else {
      try {
        var regex = new RegExp(regexStr);
        return regex.test(value);
      } catch (e) {
      }
    }
  };

  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__super();
    this.__tag && (this.__tag = this.__tag._$recycle());
    this.__followTag && (this.__followTag = this.__followTag._$recycle());
    _e._$addClassName(this.__tabbody, 'f-dn');
    if (this.__groupSelect) {
      this.__groupSelect = this.__groupSelect.destroy();
    }
    if (this.__respoSelect) {
      this.__respoSelect = this.__respoSelect.destroy();
    }
    if (this.__statusSelect) {
      this.__statusSelect = this.__statusSelect.destroy();
    }
    this.__tabhead.innerHTML = '';
    this.__doClearDomEvent();
  };
  /**
   * 审核相关按钮绑定事件
   * @return {Void}
   */
  _pro.__initAuditBtns = function () {
    var that = this;
    //解绑事件，避免重复绑定
    _v._$clearEvent(this.auditRejectBtn);
    _v._$clearEvent(this.auditAgreeBtn);
    _v._$clearEvent(this.auditSubmitBtn);
    //审核失败
    _v._$addEvent(this.auditRejectBtn, 'click', function () {
      var messageModal = new MessageModal({
        data: {
          title: '审核失败原因',
          placeholder: '请填写审核失败原因'
        }
      }).$on('ok', function (data) {
        that.__inCache._$audit({
          id: that.__interface.id,
          state: false,
          reason: data.message,
          actionMsg: '审核失败',
          onload: function (data) {
            messageModal.destroy();
            //审核失败后改变接口状态
            that.__statusChange(data.data.status);
            //更改缓存状态，以免返回列表页面状态不对
            //隐藏审核相关按钮
            _e._$addClassName(that.auditBtns, 'f-dn');
          }
        });
      });
    });
    //审核通过
    _v._$addEvent(this.auditAgreeBtn, 'click', function () {
      that.__inCache._$audit({
        id: that.__interface.id,
        state: true,
        reason: '审核通过',
        actionMsg: '审核通过',
        onload: function (data) {
          //审核通过后改变接口状态，审核通过后状态变为未开始，此处改变状态得用正常的逻辑
          that._initSelectStatus(data.data.status);
          _e._$addClassName(that.auditBtns, 'f-dn');
          //隐藏审核相关按钮
        }
      });
    });
    // 重新提交审核
    _v._$addEvent(this.auditSubmitBtn, 'click', function () {
      //审核失败的接口可以重新提交审核，状态变为审核中
      that.__inCache._$reaudit({
        id: that.__interface.id,
        actionMsg: '成功提交审核',
        onload: function (data) {
          //审核通过后改变接口状态
          that.__statusChange(data.data.status);
          //隐藏审核相关按钮
          _e._$addClassName(that.auditBtns, 'f-dn');
        }
      });
    });
  };
  /**
   * 实例化标签组件
   * @return {Void}
   */
  _pro.__initTag = function () {
    var listCacheKey = _inCache._$cacheKey + '-' + this.__pid;
    this.__tag = _tag._$$ModuleTagme._$allocate({
      parent: _e._$getByClassName(this.__body, 'tag-select')[0],
      searchCache: _inCache._$$CacheInterface,
      searchCacheKey: listCacheKey,
      searchResultFilter: function () {
        return this.__inCache._$getTagList(listCacheKey);
      }.bind(this),
      preview: true,
      choseOnly: false,
      editable: !!this._permit,
      tags: this.__interface.tag ? this.__interface.tag.split(',') : [],
      resourceId: this.__id,
      done: function (data) {
        if (!!data.change) {
          var tags = data.tags.map(function (item) {
            return item.name;
          });
          var tagSpec = this.__progroup.httpSpec.tag;
          var tagSpecDescription = this.__progroup.httpSpec.tagDescription;
          var tagValid = tags.some(function (tag) {
            return this.__checkValidity(tag, tagSpec);
          }, this);
          var tag = tags.join(',');
          if (!tagValid && tagSpec) {
            notify.show('标签不符合HTTP接口规范【' + (tagSpecDescription ? tagSpecDescription : u._$escape(tagSpec)) + '】', 'error', 3000);
            if (this.__checkCreateTime()) {
              return;
            }
          }
          this.__inCache._$updateItem({
            id: this.__id,
            data: {
              tag: tag
            }
          });
        }
      }.bind(this),
      queryData: {
        pid: this.__interface.projectId
      }
    });
  };


  /**
   * 实例化关注人标签
   * @return {Void}
   */
  _pro.__initFollowTag = function () {

    var tags = [];
    var uniqueTags = {};
    var list = this.__pgCache._$getRespoSelectSource(this.__interface.progroupId);
    var _watchList = this.__interface.watchList;

    if (_watchList && _watchList.length > 0) {
      for (var i = 0; i < _watchList.length; i++) {
        list.forEach(function (member) {
          if (member['id'] == _watchList[i] && !uniqueTags[_watchList[i]]) {
            uniqueTags[_watchList[i]] = true;
            tags.push({
              'id': _watchList[i],
              'name': member['name']
            });
          }
        });
      }
    }

    this.__followTag = _tag._$$ModuleTagme._$allocate({
      parent: _e._$getByClassName(this.__body, 'watch-list-container')[0],
      tags: tags,
      list: list,
      done: function (data) {
        if (!!data.change) {
          this.__watchList = data.tags.map(function (tag) {
            return tag.id;
          });
          this.__inCache._$updateItem({
            id: this.__id,
            data: {
              userIds: this.__watchList
            }
          });
        }
      }.bind(this),
      queryData: {
        pid: this.__interface.projectId
      }
    });
  };

  /**
   * 实例化分组选择器组件
   * @return {[type]}
   */
  _pro._initSelectGroup = function () {
    var selectDiv = _e._$getByClassName(this.__body, 'group-select')[0];
    this.__groupSelect = new Select2({
      data: {
        source: this.__groupCache._$getGroupSelectSource(this.__pid),
        selected: this.__interface.group,
        preview: true,
        editable: this._permit
      }
    }).$inject(selectDiv)
      .$on('change', function (result) {
        this.__inCache._$updateItem({
          id: this.__interface.id,
          data: {
            groupId: result.selected.id
          }
        });
      }.bind(this));
  };

  /**
   * 实例化负责人选择器组件
   * @return {[type]}
   */
  _pro._initSelectRespo = function () {
    var selectDiv = _e._$getByClassName(this.__body, 'respo-select')[0];
    var respo = this.__interface.respo;
    respo.name = respo.realname;
    this.__respoSelect = new Select2({
      data: {
        source: this.__pgCache._$getRespoSelectSource(this.__interface.progroupId),
        selected: respo,
        preview: true,
        editable: this._permit
      }
    }).$inject(selectDiv)
      .$on('change', function (result) {

        if (result.selected.id != this._currentUserId) {
          //当前用户不是负责人，隐藏发送消息按钮
          _e._$addClassName(this.__sendMessageBtn, 'fn');
        } else {
          _e._$delClassName(this.__sendMessageBtn, 'fn');
        }
        this.__inCache._$updateItem({
          id: this.__interface.id,
          data: {
            respoId: result.selected.id
          }
        });
      }.bind(this));
  };

  /**
   * 发送消息初始化
   * @param {Void}
   */
  _pro.__initMessageBox = function () {
    this.__sendMessageBtn = _e._$getByClassName(this.__body, 'send-btn')[0];
    var respo = this.__interface.respo;
    if (respo.id != this._currentUserId) {
      //当前用户不是负责人，不可以发送消息
      _e._$addClassName(this.__sendMessageBtn, 'fn');
    }
    if (this.__watchList.length == 0) {
      //当前无关注着，无法发送消息，按钮置灰
      _e._$addClassName(this.__sendMessageBtn, 'disabled');
    }

    _v._$addEvent(this.__sendMessageBtn, 'click', function () {
      if (this.__watchList.length == 0) {
        notify.show('当前接口无关注人，无法发送消息', 'error', 2000);
        return;
      }
      var _messageModal = new MessageModal({});
      _messageModal.$on('ok', function (data) {
        this.__inCache._$sendMessage({
          id: this.__interface.id,
          msg: data.message,
          onload: function () {
            _messageModal.destroy();
          }
        });
      }._$bind(this));

    }._$bind(this));
  };

  _pro.__initWatch = function () {

    _v._$addEvent(this.__watchBtn, 'click', this.__watch._$bind(this));
    _v._$addEvent(this.__cancleWatchBtn, 'click', this.__cancleWatch._$bind(this));

    if (this.__interface.isWatched == undefined) {
      //新建时后端返回数据isWatched，默认当成还没关注处理
      _e._$delClassName(this.__watchBtn, 'fn');
      _e._$addClassName(this.__cancleWatchBtn, 'fn');
    }
    this._renderWatchers(this.__watchList);
  };

  _pro.__watch = function () {
    var that = this;
    this.__inCache._$watchOrCancleWatch({
      rtype: 'interfaces',
      id: that.__interface.id,
      watch: 1,
      onload: function (event) {
        _e._$addClassName(this.__watchBtn, 'fn');
        _e._$delClassName(this.__cancleWatchBtn, 'fn');
        this.__watchList = event.data.watchList;
        this._renderWatchers(this.__watchList);
        //项目成员中对缓存进行更新
      }._$bind(this)
    });
  };

  _pro.__cancleWatch = function () {
    var that = this;
    this.__inCache._$watchOrCancleWatch({
      rtype: 'interfaces',
      id: that.__interface.id,
      watch: 0,
      onload: function (event) {
        _e._$addClassName(this.__cancleWatchBtn, 'fn');
        _e._$delClassName(this.__watchBtn, 'fn');
        this.__watchList = event.data.watchList;
        this._renderWatchers(this.__watchList);
      }._$bind(this)
    });
  };

  /**
   * 渲染关注人区域
   * @param {Array} 项目关注人
   */
  _pro._renderWatchers = function (watchList) {
    if (this.__watchList.length == 0) {
      //当前无关注着，无法发送消息，按钮置灰
      _e._$addClassName(this.__sendMessageBtn, 'disabled');
    } else {
      if (_e._$hasClassName(this.__sendMessageBtn, 'disabled')) {
        _e._$delClassName(this.__sendMessageBtn, 'disabled');
      }
    }
    var _watchArea = _e._$getByClassName(this.__body, 'watch-list-container')[0];
    var _watchers = '';
    var _members = this.__pgCache._$getRespoSelectSource(this.__interface.progroupId);
    var _watchList = watchList;
    var uniqueTags = {};
    if (_watchList && _watchList.length > 0) {
      for (var i = 0; i < _watchList.length; i++) {
        _members.map(function (member) {
          if (member['id'] == _watchList[i] && !uniqueTags[_watchList[i]]) {
            uniqueTags[_watchList[i]] = true;
            _watchers += jstExt.escape2(member['name']) + '，';
          }
        });
      }
      _watchers = _watchers.substring(0, _watchers.length - 1);
    }
    _watchArea.innerHTML = _watchers;
  };

  /**
   * 实例化状态选择器组件
   * @param {Object} status 传入状态参数
   * @return {Void}
   */
  _pro._initSelectStatus = function (status) {
    var selectDiv = _e._$getByClassName(this.__body, 'status-select')[0];
    selectDiv.innerHTML = '';
    if (status.id == dbConst.STATUS_SYS_AUDITING || status.id == dbConst.STATUS_SYS_AUDIT_FAILED) {
      this.__statusChange(status);
      return;
    }

    this.__statusSelect = new Select2({
      data: {
        source: this.__inCache._$getStatusList(this.__inCache._$getListKey(this.__id), true),
        selected: {
          name: status.name,
          id: status.id
        },
        preview: true,
        sortList: false,
        choseOnly: true,
        maxLen: 30,
        isStatus: true,
        editable: this._permit
      }
    }).$inject(selectDiv);
    var selectedName = _e._$getByClassName(selectDiv, 'status-name')[0];
    this.__respoChangeColor(status.id, selectedName);
    this.__statusSelect.$on('change', function (result) {
      this.__respoChangeColor(result.selected.id, selectedName);
      this.__inCache._$updateItem({
        id: this.__interface.id,
        data: {
          statusId: result.selected.id || ''
        }
      });
    }.bind(this));
  };

  /**
   * 改变状态选择器选中态颜色
   * @param {Number} 状态id
   * @param {Object} 显示状态节点
   * @return {Void}
   */
  _pro.__respoChangeColor = function (sid, node) {
    var sList = _inCache._$systemStatusList;
    var status = sList.find(function (it) {
      return it.id === sid;
    });
    _e._$setStyle(node, 'backgroundColor', status.bgColor);
  };

  /**
   * 当前页面切换接口状态
   * @param {Object} 状态对象
   * @return {Void}
   */
  _pro.__statusChange = function (status) {
    var selectDiv = _e._$getByClassName(this.__body, 'status-select')[0];
    //审核失败的要写明原因
    if (status.id == dbConst.STATUS_SYS_AUDIT_FAILED) {
      selectDiv.innerHTML = '<div class="u-select u-select2"><em class="status-name"><div class="u-tooltip u-tooltip-audit top-right u-fade"><div class="tooltip-arrow"></div><div class="tooltip-inner">失败原因：' + (status.reason ? jstExt.escape2(status.reason) : '未填写') + '</div></div>' + status.name + '</em></div>';
    } else {
      selectDiv.innerHTML = '<div class="u-select u-select2"><em class="status-name">' + status.name + '</em></div>';
    }
    var selectedName = _e._$getByClassName(selectDiv, 'status-name')[0];
    this.__respoChangeColor(status.id, selectedName);
    return;
  };

  /**
   * 判断是否需要发送变更通知
   */
  _pro.__needSendChangeMsg = function () {
    // 开关未打开、没有关注者 的时候，都不显示提醒
    if (this.__progroup.apiUpdateControl !== 1 ||
      this.__interface.watchList.length === 0) {
      return false;
    }

    // 只有一个关注者，并且是自己，不显示提醒
    if (this.__interface.watchList.length === 1 &&
      this.__interface.watchList[0] === this._currentUserId) {
      return false;
    }

    // 只有 已发布、测试中、开发中 的状态才会有变更确认
    var allowedStatus = [
      dbConst.STATUS_SYS_TESTING,
      dbConst.STATUS_SYS_DEVELOPING,
      dbConst.STATUS_SYS_PUBLISHED
    ];

    if (!allowedStatus.includes(this.__interface.status.id)) {
      return false;
    }

    return true;
  };

  _pro.__interfaceUpdate = function () {
    //更新关注人缓存
    var interfaceData = this.__inCache._$getItemInCache(this.__interface.id);
    interfaceData.watchList = this.__watchList || [];

    var currentMethod = this.__interface.method;
    var currentPath = this.__interface.path || '空';
    var currentReqFormat = this.__interface.reqFormat;
    var currentResFormat = this.__interface.resFormat;

    if (!this.__needSendChangeMsg()) {
      // 即使不弹出“变更消息窗”，也要更新缓存的数据
      method = currentMethod;
      path = currentPath;
      reqFormat = currentReqFormat;
      resFormat = currentResFormat;
      return;
    }

    var formatName = ['哈希', '枚举', '数组', '字符', '数值', '布尔', '文件'];
    var isChange = false;
    var content;

    // 修改是即时的，一次只改变一个
    if (currentMethod !== method) {
      content = 'Method 由“' + method + '”变更为“' + currentMethod + '”';
      method = currentMethod;
      isChange = true;
    } else if (currentPath !== path) {
      content = 'Path 由“' + path + '”变更为“' + currentPath + '”';
      path = currentPath;
      isChange = true;
    } else if (currentReqFormat !== reqFormat) {
      content = '请求数据类型由“' + formatName[reqFormat] + '”变为“' + formatName[currentReqFormat] + '”';
      reqFormat = currentReqFormat;
      isChange = true;
    } else if (currentResFormat !== resFormat) {
      content = '请求数据类型由“' + formatName[resFormat] + '”变为“' + formatName[currentResFormat] + '”';
      resFormat = currentResFormat;
      isChange = true;
    }

    if (!isChange) {
      return;
    }

    this.__showChangeDialog(content);
  };

  _pro.__headersUpdate = function () {
    if (!this.__needSendChangeMsg()) {
      return;
    }

    var newHeaders = this.__getHeaders();
    var content = this.__headerDiff(this.__headers, newHeaders);

    this.__showChangeDialog(content);

    this.__headers = newHeaders;
  };

  // 缓存接口头信息，用于差异对比
  _pro.__getHeaders = function () {
    var headerObjs = {};
    var headerArr = [];

    headerArr = [].concat(
      this.__iheaderCache._getHeaders(
        this.__interface.id,
        this.__iheaderCache._dbConst.API_HED_REQUEST
      ),
      this.__iheaderCache._getHeaders(
        this.__interface.id,
        this.__iheaderCache._dbConst.API_HED_RESPONSE
      )
    );

    headerArr.forEach(function (header) {
      headerObjs[header.id] = header;
    });

    return _cu._$clone(headerObjs);
  };

  // 对比header差异，因为是立即保存的，仅可能存在一个差异
  _pro.__headerDiff = function (headers, currentHeaders) {
    var fields = ['name', 'defaultValue', 'description'];
    var headerIds = Object.keys(headers);
    var currentHeaderIds = Object.keys(currentHeaders);
    var changeIds, changeItems, changeItemsField;

    function getHeaderTypeName(header) {
      return header.parentType === 0 ? '请求头' : '响应头';
    }

    function getHeaderFieldName(field) {
      var result;

      switch (field) {
        case 'name':
          result = '名称';
          break;
        case 'defaultValue':
          result = '默认值';
          break;
        case 'description':
          result = '描述';
          break;
        default:
          result = field;
          break;
      }

      return result;
    }

    function findChangeField(header, currentHeader) {
      var result;

      fields.forEach(function (field) {
        var value = header[field];
        var currentValue = currentHeader[field];

        if (value !== currentValue) {
          result = field;
          return;
        }
      });

      return result;
    }

    // 新增和删除
    if (headerIds.length > currentHeaderIds.length) {
      changeIds = _cu._$arrayDiff(headerIds, currentHeaderIds);
      changeItems = changeIds.map(function (id) {
        return headers[id];
      });
      changeItemsField = changeItems.map(function (item) {
        return item.name;
      }).join(', ');

      return '删除了' + getHeaderTypeName(changeItems[0]) + '“' + changeItemsField + '”';
    } else if (headerIds.length < currentHeaderIds.length) {
      changeIds = _cu._$arrayDiff(currentHeaderIds, headerIds);
      changeItems = changeIds.map(function (id) {
        return currentHeaders[id];
      });
      changeItemsField = changeItems.map(function (item) {
        return item.name;
      }).join(', ');

      return '增加了' + getHeaderTypeName(changeItems[0]) + '“' + changeItemsField + '”';
    }

    var result = '';

    // 修改
    headerIds.forEach(function (id) {
      var header = headers[id];
      var currentHeader = currentHeaders[id];
      var field = findChangeField(header, currentHeader);
      var value = header[field] || '空';
      var currentValue = currentHeader[field] || '空';

      if (field) {
        result = '将' + getHeaderTypeName(header) + header.name + '的' + getHeaderFieldName(field) +
          '由“' + value + '”修改为“' + currentValue + '”';
        return;
      }
    });

    return result;
  };

  _pro.__paramsUpdate = function () {
    if (!this.__needSendChangeMsg()) {
      return;
    }

    var newParams = this.__getParams();
    var content = this.__paramDiff(this.__params, newParams);

    this.__showChangeDialog(content);

    this.__params = newParams;
  };

  // 获取接口参数信息，用于差异对比
  _pro.__getParams = function () {
    var self = this;
    var paramObjs = {};
    var paramArr = [];
    var dataTypelist = JSON.parse(
      JSON.stringify(self.__dataTypeCache._$getListInCache(self.__dataTypeListCacheKey))
    );

    // 从DataType中获取匿名的param
    function getAttributeParams(parentId) {
      var result = [];
      var datatype = dataTypelist.find(function (item) {
        return item.id === parentId;
      });

      if (datatype) {
        result = result.concat(result, datatype.params);
      }

      result.forEach(function (item) {
        if (!item.typeName) {
          Array.prototype.push.apply(result, getAttributeParams(item.type));
        }
      });

      return result;
    }

    // 获取入参和出参
    paramArr = [].concat(
      self.__paramCache._getParams({
        parentType: self.__paramCache._dbConst.PAM_TYP_INPUT,
        parentId: self.__interface.id
      }),
      self.__paramCache._getParams({
        parentType: self.__paramCache._dbConst.PAM_TYP_OUTPUT,
        parentId: self.__interface.id
      })
    );

    // 获取object类型的匿名子params
    paramArr.forEach(function (param) {
      if (param.typeName === '') {
        Array.prototype.push.apply(paramArr, getAttributeParams(param.type));
      }
    });

    // 格式化
    paramArr.forEach(function (param) {
      paramObjs[param.id] = param;
    });

    return _cu._$clone(paramObjs);
  };

  // 对比params差异，因为是立即保存的，仅可能存在一个差异
  _pro.__paramDiff = function (params, currentParams) {
    var fields = ['name', 'typeName', 'defaultValue', 'required', 'description', 'genExpression'];
    var paramIds = Object.keys(params);
    var currentParamIds = Object.keys(currentParams);
    var changeIds, changeItems, changeItemsField;

    // 获取父级参数
    function getParentParam(param) {
      // 自己就是顶级
      if (param.parentType === 2 || param.parentType === 3) {
        return null;
      }

      // 从多的中找
      var source = currentParamIds.length > paramIds.length ?
        currentParams :
        params;

      var id = Object.keys(source).find(function (id) {
        return source[id].type === param.parentId;
      });

      return source[id];
    }

    /**
     * parentType
     *  2:请求参数
     *  3：响应结果
     *  其他：object的子字段，要通过父级判断
     */
    function getParamTypeName(param) {
      if (param.parentType === 2) {
        return '请求参数';
      } else if (param.parentType === 3) {
        return '响应结果';
      } else {
        return getParamTypeName(
          getParentParam(param)
        );
      }
    }

    // 获取完整的参数名
    function getFullFieldName(param) {
      var name = param.name;
      var parentParam;

      while (parentParam = getParentParam(param)) {
        name = parentParam.name + '.' + name;
        param = parentParam;
      }

      return name;
    }

    // required不需要知道FieldName，文案直接是改为必填 & 非必填
    function getParamFieldName(field) {
      var result;

      switch (field) {
        case 'name':
          result = '名称';
          break;
        case 'typeName':
          result = '类型';
          break;
        case 'defaultValue':
          result = '默认值';
          break;
        case 'description':
          result = '描述';
          break;
        case 'genExpression':
          result = '生成规则';
          break;
        default:
          result = field;
          break;
      }

      return result;
    }

    function findChangeField(param, currentParam) {
      var result;

      fields.forEach(function (field) {
        var value = param[field];
        var currentValue = currentParam[field];

        if (value !== currentValue) {
          result = field;
          return;
        }
      });

      return result;
    }

    // 父子节点同时存在时，移除子节点
    // 删除时不需提醒子节点
    function removeChindNodeInArray(params) {
      if (!Array.isArray(params) || params.length === 0) {
        return params;
      }

      var result = [];
      var paramTypes = params.map(function (param) {
        return param.type;
      });

      params.forEach(function (param) {
        if (paramTypes.includes(param.parentId)) {
          return;
        }

        result.push(param);
      });

      return result;
    }

    // 新增和删除
    if (paramIds.length > currentParamIds.length) {
      changeIds = _cu._$arrayDiff(paramIds, currentParamIds);
      changeItems = changeIds.map(function (id) {
        return params[id];
      });
      changeItems = removeChindNodeInArray(changeItems);

      changeItemsField = changeItems.map(function (item) {
        return getFullFieldName(item);
      }).join(', ');

      return '删除了' + getParamTypeName(changeItems[0]) + '“' + changeItemsField + '”';
    } else if (paramIds.length < currentParamIds.length) {
      changeIds = _cu._$arrayDiff(currentParamIds, paramIds);
      changeItems = changeIds.map(function (id) {
        return currentParams[id];
      });
      changeItems = removeChindNodeInArray(changeItems);

      changeItemsField = changeItems.map(function (item) {
        return getFullFieldName(item);
      }).join(', ');

      return '增加了' + getParamTypeName(changeItems[0]) + '“' + changeItemsField + '”';
    }

    var result = '';

    // 修改
    paramIds.forEach(function (id) {
      var param = params[id];
      var currentParam = currentParams[id];
      var field = findChangeField(param, currentParam);
      var defaultValue = field === 'typeName' ? 'Object' : '空';
      var value = param[field] || defaultValue;
      var currentValue = currentParam[field] || defaultValue;

      if (field) {
        result = '将' + getParamTypeName(param) + getFullFieldName(param) + '的' + getParamFieldName(field) +
          '由“' + value + '”修改为“' + currentValue + '”';
        return;
      }
    });

    return result;
  };

  // notify dispatcher
  _m._$regist(
    'res-interface-detail',
    _p._$$ModuleResInterfaceDetail
  );
});
