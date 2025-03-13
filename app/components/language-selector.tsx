import { Menu, ActionIcon } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { IconLanguage } from "@tabler/icons-react";

export function LanguageSelector() {
	const { t, i18n } = useTranslation();

	const changeLanguage = (language: string) => {
		i18n.changeLanguage(language);
	};

	return (
		<Menu shadow="md" width={200}>
			<Menu.Target>
				<ActionIcon
					variant="light"
					size="lg"
					aria-label={t("common.changeLanguage")}
				>
					<IconLanguage size={20} />
				</ActionIcon>
			</Menu.Target>
			<Menu.Dropdown>
				<Menu.Label>{t("common.selectLanguage")}</Menu.Label>
				<Menu.Item
					onClick={() => changeLanguage("en")}
					rightSection={i18n.language === "en" ? "✓" : null}
					disabled={i18n.language === "en"}
				>
					{t("common.languages.english")}
				</Menu.Item>
				<Menu.Item
					onClick={() => changeLanguage("fr")}
					rightSection={i18n.language === "fr" ? "✓" : null}
					disabled={i18n.language === "fr"}
				>
					{t("common.languages.french")}
				</Menu.Item>
				<Menu.Item
					onClick={() => changeLanguage("tr")}
					rightSection={i18n.language === "tr" ? "✓" : null}
					disabled={i18n.language === "tr"}
				>
					{t("common.languages.turkish")}
				</Menu.Item>
			</Menu.Dropdown>
		</Menu>
	);
}
