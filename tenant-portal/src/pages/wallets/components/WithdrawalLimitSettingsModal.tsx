import React, { useEffect, useMemo, useState } from 'react'
import {
  Modal,
  Form,
  InputNumber,
  Switch,
  Select,
  Button,
  Space,
  Card,
  Typography,
  Spin,
  App,
  Empty,
  Tag
} from 'antd'
import {
  SafetyCertificateOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { withdrawalRiskConfigService } from '@/services'
import type { HotWallet } from '@shared/types'

const { Text } = Typography

interface WithdrawalLimitSettingsModalProps {
  open: boolean
  wallet: HotWallet | null
  onClose: () => void
}

interface LimitFormValues {
  singleLimit: number | null
  dailyLimit: number | null
  requireApproval: boolean
}

const WithdrawalLimitSettingsModal: React.FC<WithdrawalLimitSettingsModalProps> = ({
  open,
  wallet,
  onClose,
}) => {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<LimitFormValues>()

  const [selectedChain, setSelectedChain] = useState<string | undefined>()
  const [selectedSymbol, setSelectedSymbol] = useState<string | undefined>()

  const chainOptions = useMemo(
    () => (wallet?.chainCodes ?? []).map((c) => ({ label: c.toUpperCase(), value: c })),
    [wallet?.chainCodes]
  )
  const symbolOptions = useMemo(
    () => (wallet?.symbols ?? []).map((s) => ({ label: s.toUpperCase(), value: s })),
    [wallet?.symbols]
  )

  // 当只有一个选项时自动选中
  useEffect(() => {
    if (!open) return
    if (chainOptions.length === 1) setSelectedChain(chainOptions[0].value)
    else setSelectedChain(undefined)
    if (symbolOptions.length === 1) setSelectedSymbol(symbolOptions[0].value)
    else setSelectedSymbol(undefined)
    form.resetFields()
  }, [open, chainOptions, symbolOptions, form])

  const configQueryEnabled = open && !!selectedChain && !!selectedSymbol
  const {
    data: existingConfig,
    isLoading: configLoading,
  } = useQuery({
    queryKey: ['withdrawal-risk-config', wallet?.id, selectedChain, selectedSymbol],
    queryFn: () => withdrawalRiskConfigService.getRiskConfig(selectedChain!, selectedSymbol!),
    enabled: configQueryEnabled,
  })

  // 加载已有配置到表单
  useEffect(() => {
    if (!configQueryEnabled) return
    if (configLoading) return
    if (existingConfig) {
      form.setFieldsValue({
        singleLimit: Number(existingConfig.singleLimit) || null,
        dailyLimit: Number(existingConfig.dailyLimit) || null,
        requireApproval: existingConfig.requireApproval,
      })
    } else {
      form.setFieldsValue({
        singleLimit: null,
        dailyLimit: null,
        requireApproval: false,
      })
    }
  }, [existingConfig, configLoading, configQueryEnabled, form])

  const saveMutation = useMutation({
    mutationFn: withdrawalRiskConfigService.upsertRiskConfig,
    onSuccess: () => {
      message.success('限额配置保存成功')
      queryClient.invalidateQueries({ queryKey: ['withdrawal-risk-config'] })
      queryClient.invalidateQueries({ queryKey: ['hot-wallet-detail'] })
      onClose()
    },
    onError: () => {
      message.error('限额配置保存失败')
    },
  })

  const handleSave = async () => {
    if (!selectedChain || !selectedSymbol) {
      message.warning('请先选择链和币种')
      return
    }
    try {
      const values = await form.validateFields()
      await saveMutation.mutateAsync({
        chainCode: selectedChain,
        symbol: selectedSymbol,
        singleLimit: values.singleLimit ?? 0,
        dailyLimit: values.dailyLimit ?? 0,
        requireApproval: values.requireApproval ?? false,
      })
    } catch {
      // form validation failed
    }
  }

  const pairSelected = !!selectedChain && !!selectedSymbol

  return (
    <Modal
      title={
        <Space>
          <SafetyCertificateOutlined style={{ color: '#1890ff' }} />
          <span>限额设置</span>
          {wallet && <Tag color="blue">{wallet.name}</Tag>}
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
      destroyOnHidden
    >
      {/* 链+币种选择 */}
      <Card size="small" className="mb-4">
        <Space direction="vertical" className="w-full" size="middle">
          <div>
            <Text strong className="block mb-1">链</Text>
            <Select
              className="w-full"
              placeholder="请选择链"
              options={chainOptions}
              value={selectedChain}
              onChange={(v) => {
                setSelectedChain(v)
                form.resetFields()
              }}
            />
          </div>
          <div>
            <Text strong className="block mb-1">币种</Text>
            <Select
              className="w-full"
              placeholder="请选择币种"
              options={symbolOptions}
              value={selectedSymbol}
              onChange={(v) => {
                setSelectedSymbol(v)
                form.resetFields()
              }}
            />
          </div>
        </Space>
      </Card>

      {/* 表单区域 */}
      {!pairSelected ? (
        <Empty description="请先选择链和币种" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : configLoading ? (
        <div className="text-center py-8"><Spin /></div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          initialValues={{ singleLimit: null, dailyLimit: null, requireApproval: false }}
        >
          <Card
            size="small"
            title={
              <Space>
                <SafetyCertificateOutlined className="text-orange-500" />
                <span>
                  {selectedChain?.toUpperCase()} - {selectedSymbol?.toUpperCase()}
                  {existingConfig ? (
                    <Tag color="green" className="ml-2">已配置</Tag>
                  ) : (
                    <Tag color="default" className="ml-2">未配置</Tag>
                  )}
                </span>
              </Space>
            }
            className="mb-4"
          >
            <Form.Item
              name="singleLimit"
              label="单笔提现限额"
              tooltip="单次提现允许的最大金额，留空或 0 表示不限制"
            >
              <InputNumber
                className="w-full"
                placeholder="0 = 不限制"
                min={0}
                precision={8}
                stringMode
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="dailyLimit"
              label="日提现限额"
              tooltip="每日累计提现允许的最大金额，留空或 0 表示不限制"
            >
              <InputNumber
                className="w-full"
                placeholder="0 = 不限制"
                min={0}
                precision={8}
                stringMode
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="requireApproval"
              label="需要审批"
              valuePropName="checked"
              tooltip="开启后，提现申请需经人工审批才能执行"
            >
              <Switch checkedChildren="是" unCheckedChildren="否" />
            </Form.Item>
          </Card>

          <div className="text-right">
            <Space>
              <Button onClick={onClose}>取消</Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={saveMutation.isPending}
                onClick={handleSave}
              >
                保存
              </Button>
            </Space>
          </div>
        </Form>
      )}
    </Modal>
  )
}

export default WithdrawalLimitSettingsModal
