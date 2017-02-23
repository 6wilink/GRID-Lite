# Web UI
#
# 6Harmonics Inc.
# by Qige: qige@6harmonics.com, qige.zhao@6wilink.com
# 2017.01.03 (v1.0.030117)
# 2017.01.06 (v3.0.14-060117)
# 2017.01.10 (v3.0.15-100117): PKG_NAME must SAME as directory ("package/wui/")
# 2017.02.08 (v3.1.20-080217): Move to https://github/6wilink/gws_web.git

include $(TOPDIR)/rules.mk

APP_NAME:=grid-lite
PKG_NAME:=grid-lite
PKG_VERSION:=1.0
PKG_RELEASE:=1

PKG_BUILD_DIR := $(BUILD_DIR)/$(PKG_NAME)

include $(INCLUDE_DIR)/package.mk

define Package/$(PKG_NAME)
  SECTION:=utils
  CATEGORY:=Utilities
  TITLE:=GRID Lite for GWS Products
  DEPENDS:=+uhttpd +lua +liblua +libuci-lua +libiwinfo-lua
  MAINTAINER:=Qige Zhao <zhaoqige@163.com>
endef

define Package/$(PKG_NAME)/description
  GRID Lite for GWS Products Monitor & Control.
  Analog Baseband, GWS Radio, System, Network.
endef

define Package/$(PKG_NAME)/conffiles
endef

define Build/Prepare
endef

define Build/Configure
endef

define Build/Compile
endef

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/usr/lib/lua
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_DIR) $(1)/www/cgi-bin
	$(INSTALL_DIR) $(1)/www

	$(CP) ./lib/* $(1)/usr/lib/lua/
	$(INSTALL_CONF) ./conf/$(APP_NAME).conf $(1)/etc/config/$(APP_NAME)
	$(INSTALL_BIN) ./bin/* $(1)/www/cgi-bin/
	$(CP) ./www/* $(1)/www/
endef

$(eval $(call BuildPackage,$(PKG_NAME)))

