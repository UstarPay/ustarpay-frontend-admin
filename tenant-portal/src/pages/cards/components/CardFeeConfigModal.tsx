import React, { useEffect, useState } from 'react'
import { Modal, Form, Input, Button, Table, message, Spin } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cardService } from '@/services'
import type { CardFeeConfig, CountryFeeConfig } from '@shared/types'

interface CardFeeConfigModalProps {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
}

const defaultCountryFee: CountryFeeConfig = {
  countryCode: '',
  countryName: '',
  virtualCardFee: '30.00',
  physicalCardFee: '100.00',
  deliveryFee: '0.00',
  enabled: true
}

export const CardFeeConfigModal: React.FC<CardFeeConfigModalProps> = ({
  visible,
  onClose,
  onSuccess
}) => {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  const [countryList, setCountryList] = useState<Array<CountryFeeConfig & { _key: string }>>([])

  const { data: feeConfig, isLoading } = useQuery({
    queryKey: ['card-fee-config', visible],
    queryFn: () => cardService.getFeeConfig(),
    enabled: visible
  })

  const updateMutation = useMutation({
    mutationFn: (config: CardFeeConfig) => cardService.updateFeeConfig(config),
    onSuccess: () => {
      message.success('保存成功')
      queryClient.invalidateQueries({ queryKey: ['card-fee-config'] })
      onSuccess()
    },
    onError: (err: any) => {
      message.error(err?.message || '保存失败')
    }
  })

  // 打开时回显已配置数据
  useEffect(() => {
    if (visible && feeConfig) {
      form.setFieldsValue({
        deductSymbol: feeConfig.deductSymbol ?? 'USDT',
        defaultVirtualCardFee: feeConfig.defaultVirtualCardFee ?? '30.00',
        defaultPhysicalCardFee: feeConfig.defaultPhysicalCardFee ?? '100.00'
      })
      const entries = Object.entries(feeConfig.countryFees || {})
      setCountryList(entries.map(([code, cfg]) => ({ ...cfg, _key: code })))
    }
  }, [visible, feeConfig, form])

  const handleAddCountry = () => {
    setCountryList((prev) => [...prev, { ...defaultCountryFee, _key: `new_${Date.now()}` }])
  }

  const handleRemoveCountry = (key: string) => {
    setCountryList((prev) => prev.filter((c) => c._key !== key))
  }

  const handleCountryChange = (key: string, field: keyof CountryFeeConfig, value: any) => {
    setCountryList((prev) =>
      prev.map((c) => (c._key === key ? { ...c, [field]: value } : c))
    )
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const countryFees: Record<string, CountryFeeConfig> = {}
      countryList.forEach((c) => {
        if (c.countryCode) {
          countryFees[c.countryCode] = {
            countryCode: c.countryCode,
            countryName: c.countryName,
            virtualCardFee: String(c.virtualCardFee || '30.00'),
            physicalCardFee: String(c.physicalCardFee || '100.00'),
            deliveryFee: String(c.deliveryFee || '0.00'),
            enabled: c.enabled ?? true
          }
        }
      })
      await updateMutation.mutateAsync({
        deductSymbol: feeConfig?.deductSymbol || values.deductSymbol || 'USDT',
        defaultVirtualCardFee: values.defaultVirtualCardFee,
        defaultPhysicalCardFee: values.defaultPhysicalCardFee,
        countryFees
      })
    } catch {
      // validation or mutation error
    }
  }

  return (
    <Modal
      title="开卡费用配置"
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      width={720}
      confirmLoading={updateMutation.isPending}
      destroyOnClose
      okText="保存"
      maskClosable={false}
      okButtonProps={{ disabled: isLoading }}
    >
      <Spin spinning={isLoading} tip="加载中...">
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="deductSymbol"
            label="资金支出账户（扣费币种）"
          >
            <Input placeholder="如 USDT、USD" readOnly disabled />
          </Form.Item>
          <Form.Item
            name="defaultVirtualCardFee"
            label="默认虚拟卡费用 (USD)"
            rules={[{ required: true, message: '请输入默认虚拟卡费用' }]}
          >
            <Input placeholder="30.00" allowClear />
          </Form.Item>
          <Form.Item
            name="defaultPhysicalCardFee"
            label="默认实体卡费用 (USD)"
            rules={[{ required: true, message: '请输入默认实体卡费用' }]}
          >
            <Input placeholder="100.00" allowClear />
          </Form.Item>

        <div className="mb-2 flex justify-between items-center">
          <span className="font-medium">地区差异化费率</span>
          <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={handleAddCountry}>
            添加地区
          </Button>
        </div>
        <Table
          size="small"
          dataSource={countryList}
          rowKey="_key"
          pagination={false}
          scroll={{ x: 600 }}
          columns={[
            {
              title: '地区代码',
              dataIndex: 'countryCode',
              width: 90,
              render: (v, r) => (
                <Input
                  size="small"
                  value={v}
                  placeholder="USA"
                  onChange={(e) => handleCountryChange(r._key, 'countryCode', e.target.value)}
                />
              )
            },
            {
              title: '地区名称',
              dataIndex: 'countryName',
              width: 110,
              render: (v, r) => (
                <Input
                  size="small"
                  value={v}
                  placeholder="United States"
                  onChange={(e) => handleCountryChange(r._key, 'countryName', e.target.value)}
                />
              )
            },
            {
              title: '虚拟卡费',
              dataIndex: 'virtualCardFee',
              width: 90,
              render: (v, r) => (
                <Input
                  size="small"
                  value={v}
                  placeholder="25.00"
                  onChange={(e) => handleCountryChange(r._key, 'virtualCardFee', e.target.value)}
                />
              )
            },
            {
              title: '实体卡费',
              dataIndex: 'physicalCardFee',
              width: 90,
              render: (v, r) => (
                <Input
                  size="small"
                  value={v}
                  placeholder="80.00"
                  onChange={(e) => handleCountryChange(r._key, 'physicalCardFee', e.target.value)}
                />
              )
            },
            {
              title: '配送费',
              dataIndex: 'deliveryFee',
              width: 80,
              render: (v, r) => (
                <Input
                  size="small"
                  value={v}
                  placeholder="15.00"
                  onChange={(e) => handleCountryChange(r._key, 'deliveryFee', e.target.value)}
                />
              )
            },
            {
              title: '操作',
              width: 60,
              render: (_, r) => (
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveCountry(r._key)}
                />
              )
            }
          ]}
        />
      </Form>
      </Spin>
    </Modal>
  )
}
