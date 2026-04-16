import React from "react";
import { Box, Text } from "ink";
import { logger } from "@openpos/shared";
import { SettingsScreen } from "./SettingsScreen.js";
import { StoreConfig } from "./StoreConfig.js";
import { BillingConfig } from "./BillingConfig.js";
import { ProductConfig } from "./ProductConfig.js";
import { UserConfig } from "./UserConfig.js";
import { TaxConfig } from "./TaxConfig.js";
import { PrinterConfig } from "./PrinterConfig.js";
import { SalesConfig } from "./SalesConfig.js";
import { ClientConfig } from "./ClientConfig.js";
import { LoginSettings } from "./LoginSettings.js";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class SettingsErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error("SettingsErrorBoundary: caught error", {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box flexDirection="column" padding={1}>
          <Text bold color="red">❌ Error en Settings</Text>
          <Text color="red">{this.state.error?.message}</Text>
          <Text dimColor>Presiona cualquier tecla para continuar...</Text>
        </Box>
      );
    }
    return this.props.children;
  }
}

type SettingsView = 
	| "login"
	| "main"
	| "store"
	| "billing"
	| "products"
	| "users"
	| "tax"
	| "printer"
	| "sales"
	| "clients";

type AuthUser = {
	username: string;
	role: string;
};

export function SettingsApp() {
	const [view, setView] = React.useState<SettingsView>("login");
	const [user, setUser] = React.useState<AuthUser | null>(null);

	const isAdmin = user?.role === "admin";

	const handleLogin = (authUser: AuthUser) => {
		logger.info("Settings: login success", { username: authUser.username, role: authUser.role });
		setUser(authUser);
		setView("main");
	};

	const handleLogout = () => {
		logger.info("Settings: logout");
		setUser(null);
		setView("login");
	};

	const renderContent = () => {
		if (view === "login") {
			return (
				<LoginSettings
					onLogin={handleLogin}
					onCancel={() => process.exit(0)}
				/>
			);
		}

		const navigate = (target: SettingsView) => {
			setView(target);
		};

		if (view === "main") {
			return (
				<SettingsScreen
					onSelect={(option) => {
						switch (option) {
							case 0: navigate("store"); break;
							case 1: navigate("billing"); break;
							case 2: navigate("products"); break;
							case 3: navigate("users"); break;
							case 4: navigate("tax"); break;
							case 5: navigate("printer"); break;
							case 6: navigate("sales"); break;
							case 7: navigate("clients"); break;
							case 8: handleLogout(); break;
						}
					}}
				/>
			);
		}

		if (view === "store") {
			return <StoreConfig onBack={() => navigate("main")} isAdmin={isAdmin} />;
		}
		if (view === "billing") {
			return <BillingConfig onBack={() => navigate("main")} isAdmin={isAdmin} />;
		}
		if (view === "products") {
			return <ProductConfig onBack={() => navigate("main")} isAdmin={isAdmin} />;
		}
		if (view === "users") {
			return <UserConfig onBack={() => navigate("main")} isAdmin={isAdmin} />;
		}
		if (view === "tax") {
			return <TaxConfig onBack={() => navigate("main")} isAdmin={isAdmin} />;
		}
		if (view === "printer") {
			return <PrinterConfig onBack={() => navigate("main")} isAdmin={isAdmin} />;
		}
		if (view === "sales") {
			return <SalesConfig onBack={() => navigate("main")} isAdmin={isAdmin} />;
		}
		if (view === "clients") {
			return <ClientConfig onBack={() => navigate("main")} isAdmin={isAdmin} />;
		}

		return <SettingsScreen onSelect={() => {}} />;
	};

	return (
		<SettingsErrorBoundary>
			{renderContent()}
		</SettingsErrorBoundary>
	);
}