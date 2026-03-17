import React, { useEffect } from 'react'
import { Modal, Form, InputNumber, Typography } from 'antd'
import type { Chain } from '@shared/types/chain'

const { Text } = Typography

interface ChainScanHeightModalProps {
  visible: boolean
  loading: boolean
  chain: Chain | null
  onCancel: () => void
  onSubmit: (chainCode: string, scanHeight: number) => void
}

const ChainScanHeightModal: React.FC<ChainScanHeightModalProps> = ({
  visible,
  loading,
  chain,
  onCancel,
  onSubmit
}) => {
  const [form] = Form.useForm()

  useEffect(() => {
    if (visible && chain) {
      form.setFieldsValue({
        scanHeight: chain.scanHeight
      })
    }
  }, [form, visible, chain])

  const handleSubmit = async () => {
    if (!chain) return
    
    try {
      const values = await form.validateFields()
      onSubmit(chain.chainCode, values.scanHeight)
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title="更新扫描高度"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      width={500}
      confirmLoading={loading}
      okText="更新"
      cancelText="取消"
    >
      {chain && (
        <>
          <div style={{ marginBottom: '16px' }}>
            <Text strong>区块链网络：</Text>
            <Text>{chain.chainName} ({chain.chainCode})</Text>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <Text>当前扫描高度：</Text>
            <Text code>{chain.scanHeight.toLocaleString()}</Text>
          </div>
          
          <Form form={form} layout="vertical">
            <Form.Item
              name="scanHeight"
              label="新的扫描高度"
              rules={[
                { required: true, message: '请输入扫描高度' },
                { type: 'number', min: 0, message: '扫描高度不能小于0' }
              ]}
            >
              <InputNumber 
                min={0} 
                style={{ width: '100%' }} 
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value?: string) => (parseInt(value?.replace(/\$\s?|(,*)/g, '') || '0', 10) || 0) as any}
                placeholder="输入新的扫描高度"
              />
            </Form.Item>
          </Form>
          
          <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
            提示：扫描高度决定了从哪个区块开始扫描交易，通常用于重新扫描或跳过历史区块。
          </div>
        </>
      )}
    </Modal>
  )
}

export default ChainScanHeightModal
