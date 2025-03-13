import { useTranslation } from "react-i18next";
import { useDisclosure } from "@mantine/hooks";
import { Link, useLocation } from "react-router";
import { AppShell, Group, Text, Container, Burger } from "@mantine/core";

import { LanguageSelector } from "~/components/language-selector";
import { ColorSchemeToggle } from "~/components/color-scheme-toggle";

const links = [
	{ link: "/", label: "Home" },
	{ link: "/submissions", label: "Submissions" },
];

export function AppShellLayout({ children }: { children: React.ReactNode }) {
	const [opened, { toggle }] = useDisclosure(false);
	const location = useLocation();
	const { t } = useTranslation();

	const items = links.map((link) => (
		<Link
			key={link.label}
			to={link.link}
			style={{
				display: "block",
				lineHeight: 1,
				padding: "8px 12px",
				borderRadius: "var(--mantine-radius-sm)",
				textDecoration: "none",
				color:
					location.pathname === link.link
						? "var(--mantine-color-white)"
						: "inherit",
				fontSize: "var(--mantine-font-size-sm)",
				fontWeight: 500,
				backgroundColor:
					location.pathname === link.link
						? "var(--mantine-color-blue-filled)"
						: "transparent",
			}}
		>
			{t(`navigation.${link.label.toLowerCase()}`)}
		</Link>
	));

	return (
		<AppShell withBorder header={{ height: 60 }} padding="md">
			<AppShell.Header>
				<Container size="full" h="100%">
					<Group h="100%" px="md" justify="space-between">
						<Text fw={700} size="lg">
							{t("common.appTitle")}
						</Text>

						<Group gap={5} visibleFrom="xs">
							{items}
						</Group>

						<Group>
							<Burger
								opened={opened}
								onClick={toggle}
								hiddenFrom="xs"
								size="sm"
							/>
							<LanguageSelector />
							<ColorSchemeToggle />
						</Group>
					</Group>
				</Container>
			</AppShell.Header>
			<AppShell.Main>{children}</AppShell.Main>
		</AppShell>
	);
}
