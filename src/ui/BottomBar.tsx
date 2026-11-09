import { TreeMenu } from "./menus/TreeMenu";
import styles from "./BottomBar.module.css";

export function BottomBar() {
  return (
    <div className={styles.bar}>
      <TreeMenu />
      <a href="#about" className={styles.pill}>
        About me
      </a>
    </div>
  );
}
