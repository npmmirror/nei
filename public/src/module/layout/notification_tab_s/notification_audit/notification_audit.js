NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'base/util',
  'util/tab/view',
  'util/template/tpl',
  'pro/common/module',
  'pro/common/util',
  'pro/common/jst_extend',
  'pro/notify/notify',
  'pro/stripedlist/stripedlist',
  'pro/cache/notification_cache',
  'json!{3rd}/fb-modules/config/db.json'
], function (_k, _e, _v, _u, _t, _l, _m, util, jstExt, Notify, _sl, _ncache, db, _p, _pro) {
  /**
   * 标签列表模块
   * @class   {wd.m._$$ModuleNotificationApi}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleNotificationApi = _k._$klass();
  _pro = _p._$$ModuleNotificationApi._$extend(_m._$$Module);
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-notification-api')
    );
    this.__nCache = _ncache._$$CacheNotification._$allocate();
    //记录当前是否有新的未确认
    this.__hasUnread = false;
    this.__listOpt = {
      listCache: 'notification',
      listCacheKey: _ncache._$cacheKeyAudit,
      queryData: {
        type: db.MSG_TYP_AUDIT,
        limit: 20,
        offset: 0,
        total: true
      },
      hasPager: true,
      parent: _e._$getByClassName(this.__body, 'm-notification-list')[0],
      filter: function (list, listStates) {
        // 处理 action 列
        list.forEach(function (item) {
          var itemState = listStates[item.id];
          // 待审核
          if (item.isRead == db.AUDIT_TYPE_PENDING) {
            // itemState['__nei-actions'] = '<a title="标记确认" class="u-icon-yes-normal"' +
            //     ' data-action=\'{"type":"read","keyType":"api","key":"' + _ncache._$cacheKeyApi + '",' +
            //     '"ids":["' + item.id + '"]}\' ></a>';

            item.status = '待审核';
          } else if (item.isRead == db.AUDIT_TYPE_REJECT) {
            item.status = '审核失败';
          } else {
            item.status = '审核通过';
            itemState['__class'] = 'read-row';
          }
          if (item.content) {
            var titleText = jstExt.escape2(jstExt.getText(item.title));
            itemState['__ui_title'] = '<span class="content-title" title="' + titleText + '">' + item.title + '</span>';
          }
        });
        this.__list = list;
        return list;
      }.bind(this),
      headers: [{
        name: '标题',
        key: 'title',
        valueType: 'notificationTitle',
        noEscape: true
      }, {
        name: '时间',
        key: 'createTime',
        valueType: 'time'
      }, {
        name: '状态',
        key: 'status'
      },
        {
          name: '',
          key: '__nei-actions',
          valueType: '__nei-actions'
        }
      ],
      sortable: false,
      // 批量处理的元素
      batchAction: (function () {
        return '';
      })(),
      noItemTip: '暂无数据',
      showHeader: true // 是否要显示表头, 默认为 true
    };
    this.updateList = function () {
      //点击新未确认提示，刷新列表，并隐藏提示框
      Notify.destroy();
      this.__hasUnread = false;
      this.__stripedList._$refresh();
    }.bind(this);
    this.show = false;
    _v._$addEvent(_ncache._$$CacheNotification, 'onunreadload', function (_r) {
      //监听到系统未确认消息有新增，显示提示
      if (_r.ext && _r.ext.apiUpdated && !this.__hasUnread) {
        this.__hasUnread = true;
        if (this.show) {
          Notify.tip('有新增的未确认消息，请及时查看', 0);
        }
      }
    }.bind(this));
  };
  /**
   * 显示模块
   * @param {Object} 配置信息
   * @return {Void}
   */
  _pro.__onShow = function (_options) {
    this.show = true;
    this.__stripedList = _sl._$$ModuleStripedList._$allocate(this.__listOpt);
    this.__doInitDomEvent([
      [_ncache._$$CacheNotification, 'onunreadupdate',
        function () {
          this.__stripedList._$update();
        }.bind(this)
      ]
    ]);
    Notify.notify.$on('click', this.updateList);
    this.__super(_options);
  };
  /**
   * 刷新模块
   * @param  {Object} 配置信息
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    if (this.__hasUnread && this.__stripedList) {
      this.__hasUnread = false;
      this.__stripedList._$refresh();
    }
    this.__super(_options);
  };
  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    Notify.notify.$off('click', this.updateList);
    Notify.destroy();
    this.__stripedList && this.__stripedList._$recycle();
    this.__stripedList = null;
    this.__doClearDomEvent();
    this.show = false;
    this.__super();
  };
  // notify dispatcher
  _m._$regist(
    'notification-audit',
    _p._$$ModuleNotificationApi
  );
});
