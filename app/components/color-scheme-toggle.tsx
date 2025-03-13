import {
	ActionIcon,
	Menu,
	MenuDropdown,
	MenuItem,
	MenuTarget,
	rem,
	useMantineColorScheme,
} from "@mantine/core";
import { match } from "ts-pattern";
import { useTranslation } from "react-i18next";
import { IconSun, IconMoon, IconDeviceLaptop } from "@tabler/icons-react";

export function ColorSchemeToggle() {
	const { colorScheme, setColorScheme } = useMantineColorScheme();
	const { t } = useTranslation();

	const renderColorschemeIcon = () => {
		return match(colorScheme)
			.with("auto", () => <IconDeviceLaptop size="1.2rem" />)
			.with("dark", () => <IconMoon size="1.2rem" />)
			.with("light", () => <IconSun size="1.2rem" />)
			.exhaustive();
	};

	return (
		<Menu trigger="hover" openDelay={10} closeDelay={400}>
			<MenuTarget>
				<ActionIcon
					size="lg"
					radius="sm"
					variant="light"
					style={{ width: rem(24), height: rem(24) }}
					aria-label={t("colorScheme.toggle")}
				>
					{renderColorschemeIcon()}
				</ActionIcon>
			</MenuTarget>
			<MenuDropdown>
				<MenuItem
					disabled={colorScheme === "light"}
					onClick={() => setColorScheme("light")}
					leftSection={<IconSun size="1.2rem" />}
					rightSection={colorScheme === "light" ? "✓" : null}
				>
					{t("colorScheme.light")}
				</MenuItem>
				<MenuItem
					disabled={colorScheme === "dark"}
					onClick={() => setColorScheme("dark")}
					leftSection={<IconMoon size="1.2rem" />}
					rightSection={colorScheme === "dark" ? "✓" : null}
				>
					{t("colorScheme.dark")}
				</MenuItem>
				<MenuItem
					disabled={colorScheme === "auto"}
					onClick={() => setColorScheme("auto")}
					leftSection={<IconDeviceLaptop size="1.2rem" />}
					rightSection={colorScheme === "auto" ? "✓" : null}
				>
					{t("colorScheme.system")}
				</MenuItem>
			</MenuDropdown>
		</Menu>
	);
}
