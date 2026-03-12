# ProfilePage 组件拆分重构

## 📁 文件结构

```
components/
├── UserProfileOverview.tsx       # 用户信息概览卡片
├── ProfileStatsCards.tsx         # 快速统计卡片
├── ProfileInfoForm.tsx           # 个人信息表单
├── PasswordSettings.tsx          # 密码设置
├── SecondaryPasswordSettings.tsx # 二级密码设置
├── TwoFactorAuthSettings.tsx     # 双因素认证设置 🆕
├── index.ts                      # 组件导出
└── README.md                     # 说明文档
```

## 🧩 组件功能划分

### 1. **UserProfileOverview** - 用户信息概览卡片
- **功能**: 显示用户基本信息和状态概览
- **包含内容**:
  - 用户头像和状态徽章
  - 用户姓名和邮箱
  - 账户状态、登录次数、最后登录时间
  - 创建时间、套餐名称、剩余天数
- **Props**:
  - `tenantInfo`: 租户信息
  - `getStatusColor`: 状态颜色函数
  - `getStatusText`: 状态文字函数

### 2. **ProfileStatsCards** - 快速统计卡片
- **功能**: 显示4个关键指标的统计卡片
- **包含内容**:
  - 安全状态 (密码/二级密码/2FA配置情况)
  - IP白名单数量
  - Webhook配置状态
  - 账户状态
- **特色**: 极简风格设计，顶部彩色指示条
- **Props**: 同 `UserProfileOverview`

### 3. **ProfileInfoForm** - 个人信息表单
- **功能**: 个人信息编辑和账户详情查看
- **包含内容**:
  - 基本信息表单 (姓名、邮箱、IP白名单、Webhook配置)
  - 账户详细信息展示 (所有租户字段)
- **Props**:
  - `profileData`: 表单数据
  - `setProfileData`: 表单数据更新函数
  - `loading`: 加载状态
  - `tenantInfo`: 租户信息
  - `onUpdate`: 更新回调函数

### 4. **PasswordSettings** - 密码设置
- **功能**: 主密码的更新功能
- **包含内容**:
  - 当前密码输入
  - 新密码输入
  - 确认密码输入
  - 密码状态提示
  - 密码要求说明
- **Props**:
  - `passwordData`: 密码表单数据
  - `setPasswordData`: 密码表单更新函数
  - `loading`: 加载状态
  - `tenantInfo`: 租户信息
  - `onUpdate`: 更新回调函数

### 5. **SecondaryPasswordSettings** - 二级密码设置
- **功能**: 二级密码的设置和更新
- **包含内容**:
  - 当前二级密码输入 (条件显示)
  - 新二级密码输入
  - 确认二级密码输入
  - 安全状态提示 (二级密码和2FA状态)
  - 二级密码说明
- **特色**: 智能判断是新建还是更新二级密码
- **Props**: 类似 `PasswordSettings`

### 6. **TwoFactorAuthSettings** - 双因素认证设置 🆕
- **功能**: 2FA的完整设置和管理流程
- **包含内容**:
  - 2FA状态展示和安全提醒
  - 分步骤设置流程 (启用 → 扫描二维码 → 验证完成)
  - QR码生成和显示
  - 手动密钥输入支持
  - 验证码输入和验证
  - 备份码管理 (查看和下载)
  - 2FA禁用功能
- **特色**: 
  - 完整的用户引导流程
  - 步骤指示器清晰展示进度
  - 支持QR码和手动输入两种方式
  - 安全的密码验证机制
  - 备份码安全管理
- **Props**:
  - `tenantInfo`: 租户信息
  - `loading`: 加载状态
  - `onUpdate`: 更新回调函数 (通知父组件刷新)

## 🆕 2FA集成特性

### **用户体验优化**
1. **渐进式引导**: 通过Steps组件清晰展示设置进度
2. **多种设置方式**: 支持QR码扫描和手动输入密钥
3. **实时状态同步**: 设置完成后自动更新统计卡片
4. **安全验证**: 需要输入登录密码才能启用2FA

### **安全特性**
1. **备份码管理**: 自动生成和安全存储备份码
2. **密钥保护**: 支持复制密钥到剪贴板
3. **验证机制**: 6位数字验证码实时验证
4. **状态监控**: 实时显示2FA启用状态

### **API集成**
- **获取状态**: `twoFAService.get2FAStatus()`
- **创建2FA**: `twoFAService.create2FA()`
- **验证TOTP**: `twoFAService.verifyTOTP()`
- **删除2FA**: `twoFAService.delete2FA()`

## 🎯 重构优势

### 1. **可维护性**
- 每个组件职责单一，易于理解和修改
- 组件间解耦，减少相互影响
- 代码结构清晰，便于定位问题

### 2. **可复用性**
- 统计卡片组件可在其他页面复用
- 密码设置组件可在其他安全相关页面使用
- 2FA组件可独立在其他安全设置页面使用
- 表单组件可作为其他信息编辑页面的参考

### 3. **可测试性**
- 每个组件可独立测试
- Props明确，便于编写单元测试
- 业务逻辑分离，便于模拟和验证

### 4. **开发效率**
- 多人协作时可并行开发不同组件
- 组件功能明确，便于快速定位和修改
- 统一的Props接口，便于理解和使用
- 集成完整的2FA功能，无需重复开发

## 🔧 使用方式

```tsx
import {
  UserProfileOverview,
  ProfileStatsCards,
  ProfileInfoForm,
  PasswordSettings,
  SecondaryPasswordSettings,
  TwoFactorAuthSettings
} from './components'

// 在主页面中使用
<TwoFactorAuthSettings 
  tenantInfo={tenantInfo}
  loading={loading}
  onUpdate={loadTenantInfo}  // 更新后刷新租户信息
/>
```

## 📋 主页面职责

重构后的 `ProfilePage.tsx` 主要负责：

1. **状态管理**: 管理所有表单状态和租户信息
2. **业务逻辑**: 处理各种更新操作和验证逻辑
3. **组件编排**: 组织各个子组件的布局和交互
4. **工具函数**: 提供状态转换和验证等辅助函数
5. **2FA集成**: 将2FA设置作为独立标签页提供完整功能

## 🎨 设计一致性

所有组件都遵循统一的设计规范：
- 使用 Ant Design 设计令牌
- 统一的卡片样式和间距
- 一致的颜色系统和图标使用
- 响应式布局设计
- 相同的表单验证和反馈机制

## 🛡️ 安全标签页架构

现在ProfilePage包含4个安全相关的标签页：

1. **个人信息** - 基本信息和账户详情
2. **密码设置** - 主登录密码管理
3. **二级密码** - 交易安全密码管理  
4. **双因素认证** - 2FA完整设置流程 🆕

这种模块化的架构使得代码更易维护，组件更可复用，开发效率更高，同时为用户提供了完整的安全设置体验！ 