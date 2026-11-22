import { nomeDoStatus } from "../utils/formato";

export default function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{nomeDoStatus(status)}</span>;
}
