# Loon Plugins

这里统一放我常用的 Loon 插件。以后新增插件都放在这个仓库里，不再一条规则一个仓库。

## 插件链接

### WPS Office 每日签到

```text
https://raw.githubusercontent.com/githunan/loon-plugins/main/plugins/wps-office/wps-office.plugin
```

### 瓜子影视净化

```text
https://raw.githubusercontent.com/githunan/loon-plugins/main/plugins/tilingsales/TilingSales_ad_remove.plugin
```

### 咪咕视频解锁会员

```text
https://raw.githubusercontent.com/githunan/loon-plugins/main/plugins/migu/migu_vip_share.plugin
```

### 芒果tv解锁会员

```text
https://raw.githubusercontent.com/githunan/loon-plugins/main/plugins/mgtv/mgtv_vip.plugin
```

### 追觅每日签到

```text
https://raw.githubusercontent.com/githunan/loon-plugins/main/plugins/dreame/dreame.plugin
```

## 自动同步

`.github/workflows/sync-plugins.yml` 每天自动同步上游脚本和规则。

当前同步来源：

- WPS Office：`MaYIHEI/paperclip`、`MaYIHEI/pin`
- 瓜子影视净化：`ZenmoFeiShi/Qx`
- 咪咕视频解锁会员：`ZenmoFeiShi/Qx`
- 芒果tv解锁会员：`ZenmoFeiShi/Qx`
- 追觅每日签到：`MaYIHEI/paperclip`、`MaYIHEI/pin`

如果上游更新，仓库会自动提交变化；Loon 里添加的 raw 链接保持不变。
