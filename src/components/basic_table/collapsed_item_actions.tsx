/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, {
  useState,
  useCallback,
  useMemo,
  ReactNode,
  ReactElement,
} from 'react';

import { isString } from '../../services/predicate';
import { EuiContextMenuItem, EuiContextMenuPanel } from '../context_menu';
import { EuiPopover } from '../popover';
import { EuiButtonIcon } from '../button';
import { EuiToolTip } from '../tool_tip';
import { EuiI18n } from '../i18n';

import { Action, CustomItemAction } from './action_types';
import { ItemIdResolved } from './table_types';

export interface CollapsedItemActionsProps<T extends {}> {
  actions: Array<Action<T>>;
  item: T;
  itemId: ItemIdResolved;
  actionEnabled: (action: Action<T>) => boolean;
  className?: string;
}

const actionIsCustomItemAction = <T extends {}>(
  action: Action<T>
): action is CustomItemAction<T> => action.hasOwnProperty('render');

export const CollapsedItemActions = <T extends {}>({
  actions,
  itemId,
  item,
  actionEnabled,
  className,
}: CollapsedItemActionsProps<T>) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [allDisabled, setAllDisabled] = useState(true);

  const onClickItem = useCallback((onClickAction?: () => void) => {
    setPopoverOpen(false);
    onClickAction?.();
  }, []);

  const controls = useMemo(() => {
    return actions.reduce<ReactElement[]>((controls, action, index) => {
      const available = action.available?.(item) ?? true;
      if (!available) return controls;

      const enabled = actionEnabled(action);
      if (enabled) setAllDisabled(false);

      if (actionIsCustomItemAction(action)) {
        const customAction = action as CustomItemAction<T>;
        const actionControl = customAction.render(item, enabled);
        controls.push(
          // Do not put the `onClick` on the EuiContextMenuItem itself - otherwise
          // it renders a <button> tag instead of a <div>, and we end up with nested
          // interactive elements
          <EuiContextMenuItem
            key={index}
            className="euiBasicTable__collapsedCustomAction"
          >
            <span onClick={() => onClickItem()}>{actionControl}</span>
          </EuiContextMenuItem>
        );
      } else {
        const {
          onClick,
          name,
          href,
          target,
          'data-test-subj': dataTestSubj,
        } = action;

        const buttonIcon = action.icon;
        let icon;
        if (buttonIcon) {
          icon = isString(buttonIcon) ? buttonIcon : buttonIcon(item);
        }
        const buttonContent = typeof name === 'function' ? name(item) : name;

        controls.push(
          <EuiContextMenuItem
            key={index}
            className="euiBasicTable__collapsedAction"
            disabled={!enabled}
            href={href}
            target={target}
            icon={icon}
            data-test-subj={dataTestSubj}
            onClick={() =>
              onClickItem(onClick ? () => onClick(item) : undefined)
            }
          >
            {buttonContent}
          </EuiContextMenuItem>
        );
      }
      return controls;
    }, []);
  }, [actions, actionEnabled, item, onClickItem]);

  const popoverButton = (
    <EuiI18n token="euiCollapsedItemActions.allActions" default="All actions">
      {(allActions: string) => (
        <EuiButtonIcon
          className={className}
          aria-label={allActions}
          iconType="boxesHorizontal"
          color="text"
          isDisabled={allDisabled}
          onClick={() => setPopoverOpen((isOpen) => !isOpen)}
          data-test-subj="euiCollapsedItemActionsButton"
        />
      )}
    </EuiI18n>
  );

  const withTooltip = !allDisabled && (
    <EuiI18n token="euiCollapsedItemActions.allActions" default="All actions">
      {(allActions: ReactNode) => (
        <EuiToolTip content={allActions} delay="long">
          {popoverButton}
        </EuiToolTip>
      )}
    </EuiI18n>
  );

  return (
    <EuiPopover
      className={className}
      id={`${itemId}-actions`}
      isOpen={popoverOpen}
      button={withTooltip || popoverButton}
      closePopover={() => setPopoverOpen(false)}
      panelPaddingSize="none"
      anchorPosition="leftCenter"
    >
      <EuiContextMenuPanel
        className="euiBasicTable__collapsedActions"
        items={controls}
      />
    </EuiPopover>
  );
};
