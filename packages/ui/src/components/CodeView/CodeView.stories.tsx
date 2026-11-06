import * as React from 'react';
import * as UI from '../../index';

export default { title: 'Data/CodeView', component: UI.CodeView };

const code = [
  'int trace_post_send(struct ibv_qp *qp, struct ibv_send_wr *wr, struct ibv_send_wr **bad_wr)',
  '{',
  '    struct ibt_hook_context *h = ibt_hook_context_get(qp->context, IBT_HOOK_POST_SEND, __func__);',
  '    int ret;',
  '    ibt_span_begin(ctx, OP_POST_SEND);',
  '    ret = h->post_send(qp, wr, bad_wr); /* original */',
  '    ibt_span_end_args(ctx, OP_POST_SEND, wr->num_sge, ret);',
  '    return ret;',
  '}',
].join('\n');
export const Default = {
  render: () => (
    <div style={{ maxWidth: 620 }}>
      <UI.CodeView file="src/libibtrace/hooks/ops.c" fileHref="#" code={code} start={70} target={75} />
    </div>
  ),
};
