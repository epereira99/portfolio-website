import Link from "next/link";
import { TreeMenu } from "./menus/TreeMenu";
import styles from "./BottomBar.module.css";

export function BottomBar() {
  return (
    <div className={styles.bar}>
      <TreeMenu />
      <Link href="/about" className={styles.pill}>
        About me
      </Link>
    </div>
  );
}
